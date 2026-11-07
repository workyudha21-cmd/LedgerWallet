import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { dismissToast, subscribeToToasts, type ToastItem } from "@/lib/toast"

const variants = {
  default: {
    icon: Info,
    className: "border-border",
    iconClassName: "text-muted-foreground",
  },
  success: {
    icon: CheckCircle2,
    className: "border-emerald-500/30",
    iconClassName: "text-emerald-500",
  },
  error: {
    icon: AlertCircle,
    className: "border-red-500/30",
    iconClassName: "text-red-500",
  },
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => subscribeToToasts(setToasts), [])

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((item) => {
        const variant = variants[item.variant] || variants.default
        const Icon = variant.icon

        return (
          <div
            key={item.id}
            role={item.variant === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border bg-background p-4 text-foreground shadow-lg",
              "animate-in slide-in-from-bottom-2 fade-in-0",
              variant.className
            )}
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", variant.iconClassName)} />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">{item.title}</p>
              {item.description ? (
                <p className="text-xs text-muted-foreground">{item.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => dismissToast(item.id)}
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
