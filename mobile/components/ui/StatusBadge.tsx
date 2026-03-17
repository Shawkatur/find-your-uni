import { Text, View } from "react-native";
import { AppStatus } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  lead:              { label: "Lead",             bg: "bg-muted/20",   text: "text-muted" },
  pre_evaluation:    { label: "Pre-Evaluation",   bg: "bg-purple/20",  text: "text-purple" },
  docs_collection:   { label: "Docs Needed",      bg: "bg-amber/20",   text: "text-amber" },
  applied:           { label: "Applied",          bg: "bg-primary/20", text: "text-primary" },
  offer_received:    { label: "Offer Received",   bg: "bg-accent/20",  text: "text-accent" },
  conditional_offer: { label: "Conditional",      bg: "bg-amber/20",   text: "text-amber" },
  visa_stage:        { label: "Visa Stage",       bg: "bg-purple/20",  text: "text-purple" },
  enrolled:          { label: "Enrolled 🎓",      bg: "bg-accent/20",  text: "text-accent" },
  rejected:          { label: "Not Successful",   bg: "bg-danger/20",  text: "text-danger" },
  withdrawn:         { label: "Withdrawn",        bg: "bg-muted/20",   text: "text-muted" },
};

interface Props {
  status: AppStatus | string;
}

export function StatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? { label: status, bg: "bg-muted/20", text: "text-muted" };
  return (
    <View className={`px-2.5 py-1 rounded-full ${config.bg} self-start`}>
      <Text className={`text-xs font-semibold ${config.text}`}>{config.label}</Text>
    </View>
  );
}
