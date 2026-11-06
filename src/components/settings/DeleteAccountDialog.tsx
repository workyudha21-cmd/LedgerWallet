import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/lib/auth-store"
import { useTransactionStore } from "@/lib/store"
import { auth, googleProvider } from "@/lib/firebase"
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"

function getDeleteErrorMessage(code: string) {
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect password."
    case "auth/requires-recent-login":
      return "Please sign in again before deleting your account."
    case "auth/popup-closed-by-user":
      return "Google reauthentication was cancelled."
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later."
    default:
      return "Failed to delete account. Please try again."
  }
}

export function DeleteAccountDialog() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const deleteAccountData = useTransactionStore((state) => state.deleteAccountData)
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const isPasswordUser = Boolean(
    user?.providerData.some((provider) => provider.providerId === "password")
  )
  const isGoogleUser = Boolean(
    user?.providerData.some((provider) => provider.providerId === "google.com")
  )
  const canConfirm = confirmText.trim().toUpperCase() === "DELETE"

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setPassword("")
      setConfirmText("")
      setError("")
    }
  }

  const handleDelete = async () => {
    const currentUser = auth.currentUser
    if (!currentUser) return

    if (!canConfirm) {
      setError("Type DELETE to confirm.")
      return
    }

    setLoading(true)
    setError("")

    try {
      if (isPasswordUser) {
        if (!password) {
          setError("Enter your current password.")
          setLoading(false)
          return
        }

        if (!currentUser.email) {
          setError("This account does not have an email address.")
          setLoading(false)
          return
        }

        const credential = EmailAuthProvider.credential(currentUser.email, password)
        await reauthenticateWithCredential(currentUser, credential)
      } else if (isGoogleUser) {
        await reauthenticateWithPopup(currentUser, googleProvider)
      } else {
        throw new Error("Unsupported sign-in provider.")
      }

      await deleteAccountData(currentUser.uid)
      await deleteUser(currentUser)
      localStorage.removeItem(`ledger-defaults-seeded:${currentUser.uid}`)
      localStorage.removeItem("ledger-settings")
      setOpen(false)
      setUser(null)
      useTransactionStore.setState({
        transactions: [],
        categories: [],
        budgets: [],
        accounts: [],
        recurringTransactions: [],
        goals: [],
        debts: []
      })
      navigate("/login", { replace: true })
    } catch (error) {
      const code = (error as { code?: string }).code
      setError(code ? getDeleteErrorMessage(code) : (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" /> Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete your account</DialogTitle>
          <DialogDescription>
            This permanently deletes your sign-in account and all financial data, including
            transactions, accounts, budgets, goals, debts, and categories. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isPasswordUser && (
            <div className="space-y-2">
              <Label htmlFor="delete-account-password">Current password</Label>
              <Input
                id="delete-account-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          )}

          {isGoogleUser && !isPasswordUser && (
            <p className="text-sm text-muted-foreground">
              You will be asked to confirm your identity with Google.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="delete-account-confirm">Type DELETE to confirm</Label>
            <Input
              id="delete-account-confirm"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="DELETE"
              disabled={loading}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading || !canConfirm}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
