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
        "bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center py-20 px-8 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-6">
          <Icon size={64} strokeWidth={1} className="text-slate-200" />
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 text-sm max-w-xs mb-8 leading-relaxed">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} size="lg" className="rounded-xl">
          {action.label}
        </Button>
      )}
    </div>
  );
}
