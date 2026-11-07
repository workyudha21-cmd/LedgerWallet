import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { isConsumptionExpense, isSavingsTransaction } from "@/lib/transaction-utils"
import { format } from "date-fns"

import { TransactionActions } from "@/components/transactions/TransactionActions"
import { formatCurrency } from "@/lib/utils"

export function RecentTransactions() {
  const { transactions, currency } = useTransactionStore()
  
  const recentTransactions = transactions.slice(0, 5)

  const formatAmount = (transaction: (typeof recentTransactions)[number]) => {
    if (transaction.type === 'transfer' || isSavingsTransaction(transaction)) {
      return formatCurrency(Math.abs(transaction.amount), currency)
    }

    return `${transaction.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount), currency)}`
  }

  const amountColor = (transaction: (typeof recentTransactions)[number]) =>
    transaction.type === 'income'
      ? 'text-green-500'
      : isConsumptionExpense(transaction)
        ? 'text-red-500'
        : 'text-muted-foreground'

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:hidden">
          {recentTransactions.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No transactions found.</p>
          ) : (
            recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className={`whitespace-nowrap text-sm font-medium ${amountColor(transaction)}`}>
                    {formatAmount(transaction)}
                  </span>
                  <TransactionActions transaction={transaction} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Desc</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No transactions found.
                      </TableCell>
                  </TableRow>
              ) : (
                  recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>{format(new Date(transaction.date), 'yyyy-MM-dd')}</TableCell>
                      <TableCell className={`text-right ${amountColor(transaction)}`}>
                        {formatAmount(transaction)}
                      </TableCell>
                      <TableCell>
                          <TransactionActions transaction={transaction} />
                      </TableCell>
                  </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
