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
import { format } from "date-fns"

import { TransactionActions } from "@/components/transactions/TransactionActions"
import { formatCurrency } from "@/lib/utils"

export function RecentTransactions() {
  const { transactions, currency } = useTransactionStore()
  
  const recentTransactions = transactions.slice(0, 5)

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
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
                recentTransactions.map((t) => (
                <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.description}</TableCell>
                    <TableCell>{format(new Date(t.date), 'yyyy-MM-dd')}</TableCell>
                    <TableCell className={`text-right ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(t.amount), currency)}
                    </TableCell>
                    <TableCell>
                        <TransactionActions transaction={t} />
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
