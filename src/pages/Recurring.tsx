import { AddRecurringTransactionDialog } from "@/components/recurring/AddRecurringTransactionDialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarClock, Play, Pause, Trash, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "../components/ui/badge"
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
import { useState } from "react"

export function Recurring() {
  const { recurringTransactions, currency, editRecurringTransaction, deleteRecurringTransaction, accounts } = useTransactionStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Sort by next run date
  const sorted = [...recurringTransactions].sort((a, b) => 
    new Date(a.nextRunDate).getTime() - new Date(b.nextRunDate).getTime()
  )

  const handleToggle = (id: string, currentStatus: boolean) => {
      editRecurringTransaction(id, { active: !currentStatus })
  }

  const handleDelete = () => {
      if (deleteId) {
          deleteRecurringTransaction(deleteId)
          setDeleteId(null)
      }
  }

  const getAccountName = (accId: string) => {
      return accounts.find(a => a.id === accId)?.name || 'Unknown Account'
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Recurring Transactions</h2>
        <div className="flex items-center w-full md:w-auto">
            <AddRecurringTransactionDialog />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map(item => (
            <Card key={item.id} className={!item.active ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg font-bold">{item.name}</CardTitle>
                            <CardDescription className="capitalize">{item.frequency} - {item.type}</CardDescription>
                        </div>
                        <Badge variant={item.active ? "default" : "secondary"}>
                            {item.active ? "Active" : "Paused"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center mb-4">
                        <div className={`text-2xl font-bold ${item.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, currency)}
                        </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4" />
                            Next: {format(new Date(item.nextRunDate), "PPP")}
                        </div>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Account: {getAccountName(item.accountId)}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggle(item.id, item.active)}
                        >
                            {item.active ? <Pause className="h-4 w-4 mr-1"/> : <Play className="h-4 w-4 mr-1"/>}
                            {item.active ? 'Pause' : 'Resume'}
                        </Button>
                        <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setDeleteId(item.id)}
                        >
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        ))}

        {sorted.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted-foreground">
                No recurring transactions found. Create one to get started!
            </div>
        )}
      </div>

       <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Stop this subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete this recurring rule. Past transactions created by this rule will remain.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
