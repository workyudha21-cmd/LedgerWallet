import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Account } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"
import { Wallet, Landmark, CreditCard, Banknote, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { useTransactionStore } from "@/lib/store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { EditAccountDialog } from "./EditAccountDialog"
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

interface AccountCardProps {
  account: Account
  currency: 'IDR' | 'USD'
}

export function AccountCard({ account, currency }: AccountCardProps) {
  const removeAccount = useTransactionStore((state) => state.removeAccount)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cash': return <Banknote className="h-4 w-4" />
      case 'bank': return <Landmark className="h-4 w-4" />
      case 'wallet': return <Wallet className="h-4 w-4" />
      case 'investment': return <CreditCard className="h-4 w-4" />
      default: return <Wallet className="h-4 w-4" />
    }
  }

  return (
    <>
        <Card className="relative overflow-hidden transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
            {getIcon(account.type)}
            {account.name}
            </CardTitle>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEdit(true)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                    onClick={() => setShowDelete(true)}
                    className="text-red-600"
                >
                <Trash className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(account.balance, currency)}</div>
            <p className="text-xs text-muted-foreground capitalize">
            {account.type} Account
            </p>
        </CardContent>
        </Card>

        <EditAccountDialog 
            account={account} 
            open={showEdit} 
            onOpenChange={setShowEdit} 
        />

        <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the account <strong>{account.name}</strong>.
                        Past transactions linked to this account will remain but will be unlinked.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => removeAccount(account.id)}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  )
}
