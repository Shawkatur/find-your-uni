import { useState, useRef } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { useChat, ChatMessage } from "@/hooks/useChat";

export default function ChatScreen() {
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const { messages, loading, sendMessage, sending, consultantInfo } = useChat();

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText("");
  };

  // No consultant assigned
  if (!loading && (!consultantInfo || !consultantInfo.assigned)) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-4xl mb-3">💬</Text>
          <Text className="text-text-base text-lg font-bold text-center">
            No Consultant Assigned
          </Text>
          <Text className="text-text-muted text-sm text-center mt-2">
            Chat will be available once a consultant is assigned to your
            application.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Loading state
  if (loading) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center">
          <Text className="text-text-muted text-sm">Loading chat...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  const consultantName =
    consultantInfo?.consultant?.full_name ?? "Your Consultant";
  const consultantRole =
    consultantInfo?.consultant?.role_title ?? "Consultant";

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
            {consultantName}
          </Text>
          <Text className="text-text-muted text-xs">{consultantRole}</Text>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m: ChatMessage) => m.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          renderItem={({ item }: { item: ChatMessage }) => {
            const isMe = item.sender_type === "student";
            return (
              <View
                className={`max-w-[80%] ${isMe ? "self-end" : "self-start"}`}
              >
                <View
                  className={`px-4 py-2.5 rounded-2xl ${
                    isMe
                      ? "bg-indigo-600 rounded-br-sm"
                      : "bg-surface-card rounded-bl-sm"
                  }`}
                >
                  <Text
                    className={`text-sm ${isMe ? "text-white" : "text-text-base"}`}
                  >
                    {item.content}
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
              <Text className="text-text-muted text-sm">
                No messages yet. Say hello!
              </Text>
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
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim() || sending}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              !text.trim() || sending ? "bg-indigo-600/50" : "bg-indigo-600"
            }`}
          >
            <Text className="text-white text-lg">↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
