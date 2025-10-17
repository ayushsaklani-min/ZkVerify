import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-md border border-white/20 bg-[#0b0f19]/90 text-white placeholder:text-white/50 px-4 py-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
