"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-150 outline-none select-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Emerald primary — the flagship CTA
        default:
          "bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-[0_4px_0_#065F46] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#065F46,0_14px_28px_-8px_rgba(16,185,129,0.4)] active:translate-y-[3px] active:shadow-none",
        // Warm yellow accent — for highlights
        magic:
          "bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] text-[#92400E] shadow-[0_4px_0_#B45309] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#B45309,0_14px_28px_-8px_rgba(251,191,36,0.5)] active:translate-y-[3px] active:shadow-none",
        outline:
          "border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] hover:text-[#333] hover:border-[#CBD5E1]",
        secondary:
          "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] border border-[#E2E8F0]",
        ghost:
          "text-[#64748B] hover:text-[#333] hover:bg-[#F1F5F9]",
        destructive:
          "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
        link: "text-[#10B981] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-1.5 px-4",
        xs: "h-6 gap-1 px-2 text-xs rounded-lg",
        sm: "h-10 gap-1 px-3 text-xs",
        lg: "h-11 gap-2 px-6 text-base",
        xl: "h-13 gap-2.5 px-8 text-base",
        icon: "size-9",
        "icon-xs": "size-6 rounded-lg",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
