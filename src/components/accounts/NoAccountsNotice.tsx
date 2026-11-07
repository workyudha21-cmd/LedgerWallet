import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface NoAccountsNoticeProps {
  title?: string
  description?: string
  actionLabel?: string
  onClose?: () => void
}

export function NoAccountsNotice({
  title = "No accounts yet",
  description = "Create a Cash, Bank, or Wallet account before continuing.",
  actionLabel = "Create Account",
  onClose,
}: NoAccountsNoticeProps) {
  const navigate = useNavigate()

  return (
    <div className="space-y-4 rounded-lg border border-dashed p-6 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Wallet className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Button
        className="w-full"
        onClick={() => {
          onClose?.()
          navigate("/accounts")
        }}
      >
        {actionLabel}
      </Button>
    </div>
  )
}
