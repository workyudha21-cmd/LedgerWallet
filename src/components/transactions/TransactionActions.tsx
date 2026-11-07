import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { type Transaction, useTransactionStore } from "@/lib/store"
import { formatCurrencyInput } from "@/lib/utils"
import { TransactionForm, type TransactionFormValues } from "./TransactionForm"

interface TransactionActionsProps {
  transaction: Transaction
}

export function TransactionActions({ transaction }: TransactionActionsProps) {
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  
  const editTransaction = useTransactionStore((state) => state.editTransaction)
  const removeTransaction = useTransactionStore((state) => state.removeTransaction)
  const isLinked = Boolean(transaction.goalId || transaction.debtId || transaction.assetId) ||
    transaction.type === 'transfer' ||
    transaction.type === 'savings' ||
    !transaction.accountId

  function onConfirmDelete() {
    removeTransaction(transaction.id)
    setOpenDelete(false)
  }

  function onEditSubmit(values: TransactionFormValues) {
    editTransaction(transaction.id, {
        description: values.description,
        amount: parseInt(values.amount.replace(/\D/g, ""), 10),
        type: values.type,
        category: values.category,
        accountId: values.accountId,
        debtId: values.debtId && values.debtId !== "none" ? values.debtId : undefined,
        date: values.date.toISOString(),
    })
    setOpenEdit(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {!isLinked && (
            <DropdownMenuItem onClick={() => setOpenEdit(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setOpenDelete(true)} className="text-red-600">
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm 
            defaultValues={{
                description: transaction.description,
                amount: formatCurrencyInput(String(transaction.amount)),
                type: transaction.type === 'income' ? 'income' : 'expense',
                category: transaction.category,
                accountId: transaction.accountId,
                debtId: transaction.debtId || "none",
                date: new Date(transaction.date),
            }} 
            onSubmit={onEditSubmit} 
            submitLabel="Save Changes" 
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {transaction.goalId
                ? "This will permanently delete the transaction and reduce the linked goal's saved amount."
                : transaction.debtId
                  ? "This will permanently delete the transaction and restore the linked debt's remaining amount."
                  : transaction.assetId
                    ? "This will delete the contribution and reduce the linked asset's value."
                    : transaction.type === 'transfer'
                      ? "This will delete the transfer and restore both account balances."
                      : "This action cannot be undone. This will permanently delete the transaction."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
