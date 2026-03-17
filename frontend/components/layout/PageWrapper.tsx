"use client";

import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageWrapper({ children, className, title, subtitle, actions }: PageWrapperProps) {
  return (
    <div className={cn("p-4 sm:p-6 lg:p-8 pb-24 md:pb-6 max-w-7xl mx-auto", className)}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
          <div>
            {title && (
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">{title}</h1>
            )}
            {subtitle && (
              <p className="text-slate-400 mt-1 font-normal">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
