import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type AppStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "offer_received"
  | "enrolled"
  | "rejected"
  | "withdrawn";

const statusConfig: Record<AppStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-700 text-slate-300" },
  submitted: { label: "Submitted", className: "bg-blue-600/20 text-blue-400 border-blue-500/30" },
  under_review: { label: "Under Review", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  offer_received: { label: "Offer Received", className: "bg-green-500/20 text-green-400 border-green-500/30" },
  enrolled: { label: "Enrolled", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  rejected: { label: "Rejected", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  withdrawn: { label: "Withdrawn", className: "bg-slate-600/20 text-slate-400" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as AppStatus] ?? {
    label: status.replace(/_/g, " "),
    className: "bg-slate-700 text-slate-300",
  };

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium border", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
