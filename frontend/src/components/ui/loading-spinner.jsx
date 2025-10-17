import { cn } from "@/lib/utils"

export function LoadingSpinner({ className, size = "default", ...props }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-white/20 border-t-indigo-400",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
}
