"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
}

export function GlassCard({ children, className, hover = false, padding = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card",
        hover && "glass-card-hover cursor-pointer",
        padding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
