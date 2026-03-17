import { Text, View } from "react-native";
import { AppStatus, StatusHistoryEntry } from "@/types";

const STATUS_ORDER: AppStatus[] = [
  "lead",
  "pre_evaluation",
  "docs_collection",
  "applied",
  "offer_received",
  "visa_stage",
  "enrolled",
];

const STATUS_LABELS: Record<string, string> = {
  lead:              "Enquiry",
  pre_evaluation:    "Pre-Eval",
  docs_collection:   "Docs",
  applied:           "Applied",
  offer_received:    "Offer",
  conditional_offer: "Conditional",
  visa_stage:        "Visa",
  enrolled:          "Enrolled",
  rejected:          "Rejected",
  withdrawn:         "Withdrawn",
};

interface Props {
  currentStatus: string;
  history: StatusHistoryEntry[];
}

export function StatusTimeline({ currentStatus, history }: Props) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus as AppStatus);
  const isTerminal = ["rejected", "withdrawn"].includes(currentStatus);

  return (
    <View>
      <View className="flex-row items-center gap-1 flex-wrap">
        {STATUS_ORDER.map((status, i) => {
          const done = i < currentIndex || (i === currentIndex && !isTerminal);
          const active = i === currentIndex && !isTerminal;
          const future = i > currentIndex;
          return (
            <View key={status} className="flex-row items-center">
              <View
                className={`w-2.5 h-2.5 rounded-full ${
                  done ? "bg-accent" : active ? "bg-primary" : "bg-surface-2"
                } border ${done ? "border-accent" : active ? "border-primary" : "border-white/10"}`}
              />
              {i < STATUS_ORDER.length - 1 && (
                <View className={`w-4 h-px ${done ? "bg-accent" : "bg-white/10"}`} />
              )}
            </View>
          );
        })}
      </View>

      {/* History log */}
      {history.length > 0 && (
        <View className="mt-4 gap-2">
          {history.map((entry, i) => (
            <View key={i} className="flex-row gap-2">
              <View className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
              <View className="flex-1">
                <Text className="text-text-base text-sm font-semibold">
                  {STATUS_LABELS[entry.status] ?? entry.status}
                </Text>
                {entry.note && (
                  <Text className="text-text-muted text-xs">{entry.note}</Text>
                )}
                <Text className="text-text-muted text-xs">
                  {new Date(entry.changed_at).toLocaleDateString("en-BD", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
