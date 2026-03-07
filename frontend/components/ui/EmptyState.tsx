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
          <div className="glow-blue" />
          <div className="relative w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
            <Icon size={28} className="text-blue-400" />
          </div>
        </div>
      )}
      <h3 className="text-lg font-black tracking-tight text-white mb-2">{title}</h3>
      {description && (
        <p className="text-slate-400 text-sm max-w-xs mb-6 font-normal leading-relaxed">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
