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
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog"
import { TransactionActions } from "@/components/transactions/TransactionActions"
import { ExportButton } from "@/components/common/ExportButton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { formatCurrency } from "@/lib/utils"

export function Transactions() {
  const { transactions, currency } = useTransactionStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all") // simplified date filter (all, this month, last month)

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = (t.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || t.type === typeFilter
    
    let matchesDate = true
    const tDate = new Date(t.date)
    const now = new Date()
    
    if (dateFilter === "thisMonth") {
        matchesDate = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()
    } else if (dateFilter === "lastMonth") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        matchesDate = tDate.getMonth() === lastMonth.getMonth() && tDate.getFullYear() === lastMonth.getFullYear()
    } else if (dateFilter === "thisYear") {
        matchesDate = tDate.getFullYear() === now.getFullYear()
    }
    
    return matchesSearch && matchesType && matchesDate
  })

  // ... (exportCSV function) 


  return (
    <div className="flex-1 space-y-4">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
        <div className="flex items-center space-x-2">
            <ExportButton transactions={filteredTransactions} currency={currency} />
            <AddTransactionDialog>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Transaction
                </Button>
            </AddTransactionDialog>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input 
            placeholder="Search description or category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-[300px]"
        />
        <div className="flex gap-2 w-full md:w-auto">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
            </Select>
             <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                 <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                     <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
    
      {/* Desktop View */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>All Transactions ({filteredTransactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No transactions found matching your filters.
                      </TableCell>
                  </TableRow>
              ) : (
                  filteredTransactions.map((t) => (
                  <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.description}</TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {transactions.find(tr => tr.id === t.id)?.accountId 
                            ? useTransactionStore.getState().accounts.find(a => a.id === t.accountId)?.name || '-' 
                            : '-'
                        }
                      </TableCell>
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

      {/* Mobile View */}
      <div className="space-y-4 md:hidden">
        <h3 className="font-semibold text-muted-foreground mb-2">
            All Transactions ({filteredTransactions.length})
        </h3>
        {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border">
                No transactions found matching your filters.
            </div>
        ) : (
            filteredTransactions.map((t) => (
                <Card key={t.id} className="overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div className="font-bold truncate pr-2">{t.description}</div>
                            <div className={`whitespace-nowrap font-medium ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(t.amount), currency)}
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                             <div className="flex items-center gap-2">
                                <span>{format(new Date(t.date), 'MMM dd, yyyy')}</span>
                                <span>•</span>
                                <span className="capitalize">{t.category}</span>
                             </div>
                        </div>
                        <div className="flex justify-end border-t pt-3">
                             <TransactionActions transaction={t} />
                        </div>
                    </CardContent>
                </Card>
            ))
        )}
      </div>
    </div>
  )
}
