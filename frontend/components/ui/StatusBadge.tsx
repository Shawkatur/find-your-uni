import { cn } from "@/lib/utils";

type AppStatus =
  | "lead"
  | "pre_evaluation"
  | "docs_collection"
  | "applied"
  | "offer_received"
  | "conditional_offer"
  | "visa_stage"
  | "enrolled"
  | "rejected"
  | "withdrawn";

const statusConfig: Record<AppStatus, { label: string; pillClass: string }> = {
  lead:              { label: "Lead",              pillClass: "tag-pill tag-pill-slate" },
  pre_evaluation:    { label: "Pre-Evaluation",   pillClass: "tag-pill tag-pill-blue" },
  docs_collection:   { label: "Docs Collection",  pillClass: "tag-pill tag-pill-yellow" },
  applied:           { label: "Applied",           pillClass: "tag-pill tag-pill-indigo" },
  offer_received:    { label: "Offer Received",    pillClass: "tag-pill tag-pill-green" },
  conditional_offer: { label: "Conditional Offer", pillClass: "tag-pill tag-pill-yellow" },
  visa_stage:        { label: "Visa Stage",        pillClass: "tag-pill tag-pill-purple" },
  enrolled:          { label: "Enrolled",          pillClass: "tag-pill tag-pill-green" },
  rejected:          { label: "Rejected",          pillClass: "tag-pill tag-pill-red" },
  withdrawn:         { label: "Withdrawn",         pillClass: "tag-pill tag-pill-slate" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as AppStatus] ?? {
    label: status.replace(/_/g, " "),
    pillClass: "tag-pill tag-pill-slate",
  };

  return (
    <span className={cn(config.pillClass, className)}>
      {config.label}
    </span>
  );
}
