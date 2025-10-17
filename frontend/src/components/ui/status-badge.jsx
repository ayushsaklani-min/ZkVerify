import { cn } from "@/lib/utils"
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

export function StatusBadge({ status, className, ...props }) {
  const statusConfig = {
    verified: {
      icon: CheckCircle,
      text: "Verified",
      className: "text-green-400 bg-green-400/10 border-green-400/20"
    },
    unverified: {
      icon: XCircle,
      text: "Unverified",
      className: "text-red-400 bg-red-400/10 border-red-400/20"
    },
    pending: {
      icon: Clock,
      text: "Pending",
      className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
    },
    error: {
      icon: AlertCircle,
      text: "Error",
      className: "text-orange-400 bg-orange-400/10 border-orange-400/20"
    }
  }

  const config = statusConfig[status] || statusConfig.unverified
  const Icon = config.icon

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium",
        config.className,
        className
      )}
      {...props}
    >
      <Icon className="h-4 w-4" />
      {config.text}
    </div>
  )
}
