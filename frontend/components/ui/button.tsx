"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl text-sm font-bold whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // 3D primary button per design spec
        default:
          "bg-blue-600 text-white border-b-4 border-blue-800 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(59,130,246,0.8)] active:border-b-0 active:translate-y-0.5",
        outline:
          "border border-white/10 bg-transparent text-slate-300 hover:bg-white/8 hover:text-white hover:border-white/20",
        secondary:
          "bg-slate-700/60 text-slate-200 hover:bg-slate-700 border border-white/10",
        ghost:
          "text-slate-400 hover:text-white hover:bg-white/8",
        destructive:
          "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
        link: "text-blue-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-4",
        xs: "h-6 gap-1 px-2 text-xs rounded-lg",
        sm: "h-8 gap-1 px-3 text-xs",
        lg: "h-11 gap-2 px-6 text-base",
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
