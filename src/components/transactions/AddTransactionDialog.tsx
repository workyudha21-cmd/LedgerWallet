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

import { useAuthStore } from "@/lib/auth-store"

export function AddTransactionDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const addTransaction = useTransactionStore((state) => state.addTransaction)
  const user = useAuthStore((state) => state.user)

  function onSubmit(values: TransactionFormValues) {
    if (!user) return

    addTransaction({
      description: values.description,
      amount: Number(values.amount),
      type: values.type,
      category: values.category,
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
            Add a new income or expense record.
          </DialogDescription>
        </DialogHeader>
        <TransactionForm onSubmit={onSubmit} submitLabel="Add Transaction" />
      </DialogContent>
    </Dialog>
  )
}
