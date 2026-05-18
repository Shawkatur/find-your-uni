import { useEffect, useState, useRef } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import api from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  sender_role: string;
  body: string;
  created_at: string;
}

export default function ChatScreen() {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const { data: consultantInfo } = useQuery({
    queryKey: ["chat-consultant"],
    queryFn: () => api.get("/messages/consultant-info").then((r) => r.data),
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["chat-messages"],
    queryFn: () => api.get("/messages").then((r) => r.data ?? []),
    enabled: !!consultantInfo,
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => api.post("/messages", { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-messages"] });
      setText("");
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("mobile-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => qc.invalidateQueries({ queryKey: ["chat-messages"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  if (!consultantInfo) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-4xl mb-3">💬</Text>
          <Text className="text-text-base text-lg font-bold text-center">
            No Consultant Assigned
          </Text>
          <Text className="text-text-muted text-sm text-center mt-2">
            Chat will be available once a consultant is assigned to your application.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const sorted = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View className="px-5 py-3 border-b border-border-subtle">
          <Text className="text-text-base font-bold text-base">
            {consultantInfo.consultant_name ?? "Your Consultant"}
          </Text>
          <Text className="text-text-muted text-xs">
            {consultantInfo.agency_name ?? "Consultant"}
          </Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={sorted}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          renderItem={({ item }) => {
            const isMe = item.sender_role === "student";
            return (
              <View className={`max-w-[80%] ${isMe ? "self-end" : "self-start"}`}>
                <View
                  className={`px-4 py-2.5 rounded-2xl ${
                    isMe ? "bg-indigo-600 rounded-br-sm" : "bg-surface-card rounded-bl-sm"
                  }`}
                >
                  <Text className={`text-sm ${isMe ? "text-white" : "text-text-base"}`}>
                    {item.body}
                  </Text>
                </View>
                <Text className="text-text-muted text-[10px] mt-1 px-1">
                  {new Date(item.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Text className="text-text-muted text-sm">No messages yet. Say hello!</Text>
            </View>
          }
        />

        {/* Input */}
        <View className="flex-row items-center px-4 py-3 border-t border-border-subtle gap-2">
          <TextInput
            className="flex-1 bg-surface-card text-text-base rounded-full px-4 py-2.5 text-sm"
            placeholder="Type a message..."
            placeholderTextColor="#6B7280"
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => {
              if (text.trim()) sendMutation.mutate(text.trim());
            }}
          />
          <TouchableOpacity
            onPress={() => {
              if (text.trim()) sendMutation.mutate(text.trim());
            }}
            disabled={!text.trim() || sendMutation.isPending}
            className="w-10 h-10 bg-indigo-600 rounded-full items-center justify-center"
          >
            <Text className="text-white text-lg">↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
