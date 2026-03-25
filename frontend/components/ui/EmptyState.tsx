import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "glass-card-dashed flex flex-col items-center justify-center py-16 px-8 text-center",
        className
      )}
    >
      {Icon && (
        <div className="relative mb-5">
          <div className="relative w-16 h-16 rounded-2xl bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)] flex items-center justify-center">
            <Icon size={28} className="text-[#10B981]" />
          </div>
        </div>
      )}
      <h3 className="text-lg font-black tracking-tight text-[#333] mb-2">{title}</h3>
      {description && (
        <p className="text-[#64748B] text-sm max-w-xs mb-6 font-normal leading-relaxed">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
