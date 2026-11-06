import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuthStore } from "@/lib/auth-store"
import { useTransactionStore, type BackupData } from "@/lib/store"
import { isBackupData } from "@/lib/backup"
import { Download, Upload } from "lucide-react"
import { format } from "date-fns"
import { useRef, useState } from "react"

export function BackupRestore() {
  const {
    currency,
    financialTargets,
    accounts,
    assets,
    transactions,
    categories,
    budgets,
    recurringTransactions,
    goals,
    debts,
    healthSnapshots,
    importBackup,
  } = useTransactionStore()
  const user = useAuthStore((state) => state.user)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const hasData =
    transactions.length > 0 ||
    accounts.length > 0 ||
    budgets.length > 0 ||
    recurringTransactions.length > 0 ||
    goals.length > 0 ||
    debts.length > 0

  const handleDownload = () => {
    const backup: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      currency,
      financialTargets,
      accounts,
      assets,
      transactions,
      categories,
      budgets,
      recurringTransactions,
      goals,
      debts,
      healthSnapshots,
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `ledger-backup-${format(new Date(), "yyyy-MM-dd")}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setError("")
    setMessage("Backup downloaded.")
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    try {
      const parsed: unknown = JSON.parse(await file.text())

      if (!isBackupData(parsed)) {
        setError("That file is not a valid Ledger Wallet backup.")
        setMessage("")
        return
      }

      setError("")
      setMessage("")
      setPendingBackup(parsed)
    } catch {
      setError("Could not read the backup file.")
      setMessage("")
    }
  }

  const handleRestore = async () => {
    if (!user || !pendingBackup) return

    try {
      await importBackup(pendingBackup, user.uid)
      setMessage(
        `Backup restored: ${pendingBackup.transactions.length} transactions and ${pendingBackup.accounts.length} accounts.`
      )
      setPendingBackup(null)
    } catch (error) {
      setError((error as Error).message)
      setPendingBackup(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="mr-1 h-4 w-4" /> Backup
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={hasData}
          title={hasData ? "Delete all data before restoring a backup" : undefined}
        >
          <Upload className="mr-1 h-4 w-4" /> Restore
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-xs text-destructive text-right">{error}</p>}
      {message && <p className="text-xs text-emerald-600 text-right">{message}</p>}

      <AlertDialog open={!!pendingBackup} onOpenChange={(open) => !open && setPendingBackup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will import {pendingBackup?.transactions.length ?? 0} transactions,{" "}
              {pendingBackup?.accounts.length ?? 0} accounts, and related records from the backup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
