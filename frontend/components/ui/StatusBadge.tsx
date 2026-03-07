import { cn } from "@/lib/utils";

type AppStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "offer_received"
  | "enrolled"
  | "rejected"
  | "withdrawn";

const statusConfig: Record<AppStatus, { label: string; pillClass: string }> = {
  draft:         { label: "Draft",          pillClass: "tag-pill tag-pill-slate" },
  submitted:     { label: "Submitted",      pillClass: "tag-pill tag-pill-blue" },
  under_review:  { label: "Under Review",   pillClass: "tag-pill tag-pill-yellow" },
  offer_received:{ label: "Offer Received", pillClass: "tag-pill tag-pill-green" },
  enrolled:      { label: "Enrolled",       pillClass: "tag-pill tag-pill-green" },
  rejected:      { label: "Rejected",       pillClass: "tag-pill tag-pill-red" },
  withdrawn:     { label: "Withdrawn",      pillClass: "tag-pill tag-pill-slate" },
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
