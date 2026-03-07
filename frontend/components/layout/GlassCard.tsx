"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: boolean;
  dashed?: boolean;
}

export function GlassCard({ children, className, hover = false, padding = true, dashed = false }: GlassCardProps) {
  return (
    <div
      className={cn(
        dashed ? "glass-card-dashed" : "glass-card",
        hover && "glass-card-hover cursor-pointer",
        padding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
