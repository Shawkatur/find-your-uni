import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#333] transition-colors outline-none placeholder:text-[#94A3B8] focus-visible:border-[#10B981] focus-visible:ring-1 focus-visible:ring-[#10B981]/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-1 aria-invalid:ring-red-500/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
