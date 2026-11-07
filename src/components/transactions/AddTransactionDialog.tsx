import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useTransactionStore } from "@/lib/store"
import { useState } from "react"
import { TransactionForm, type TransactionFormValues } from "./TransactionForm"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { useAuthStore } from "@/lib/auth-store"

export function AddTransactionDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const addTransaction = useTransactionStore((state) => state.addTransaction)
  const accounts = useTransactionStore((state) => state.accounts)
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const hasAccounts = accounts.length > 0

  function onSubmit(values: TransactionFormValues) {
    if (!user) return

    addTransaction({
      description: values.description,
      amount: parseInt(values.amount.replace(/\D/g, ""), 10),
      type: values.type,
      category: values.category,
      accountId: values.accountId,
      debtId: values.debtId && values.debtId !== "none" ? values.debtId : undefined,
      date: values.date.toISOString(), // Firestore prefers ISO strings or Timestamp, store expects string
    }, user.uid)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            {hasAccounts
              ? "Add a new income or expense record."
              : "You need an account before you can record a transaction."}
          </DialogDescription>
        </DialogHeader>
        {hasAccounts ? (
          <TransactionForm onSubmit={onSubmit} submitLabel="Add Transaction" />
        ) : (
          <div className="space-y-4 rounded-lg border border-dashed p-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">No accounts yet</p>
              <p className="text-xs text-muted-foreground">
                Create a Cash, Bank, or Wallet account first. Transactions always need an account.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setOpen(false)
                navigate("/accounts")
              }}
            >
              Create Account
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
