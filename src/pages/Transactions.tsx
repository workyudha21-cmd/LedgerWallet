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
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog"
import { TransactionActions } from "@/components/transactions/TransactionActions"
import { ExportButton } from "@/components/common/ExportButton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { formatCurrency } from "@/lib/utils"

const PAGE_SIZE = 20

export function Transactions() {
  const { transactions, currency, accounts, assets } = useTransactionStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all") // simplified date filter (all, this month, last month)
  const [page, setPage] = useState(1)

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = (t.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "expense"
        ? isConsumptionExpense(t)
        : typeFilter === "savings"
          ? isSavingsTransaction(t)
          : t.type === typeFilter)
    
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

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const getAccountName = (accountId?: string) =>
    accounts.find((account) => account.id === accountId)?.name || "-"

  const getAssetName = (assetId?: string) =>
    assets.find((asset) => asset.id === assetId)?.name || "-"

  // ... (exportCSV function) 


  return (
    <div className="flex-1 space-y-4">
       <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
        <div className="flex flex-wrap items-center gap-2">
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
            onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
            }}
            className="w-full md:w-[300px]"
        />
        <div className="flex gap-2 w-full md:w-auto">
            <Select value={typeFilter} onValueChange={(value) => {
                setTypeFilter(value)
                setPage(1)
            }}>
                <SelectTrigger className="w-full md:w-[150px]">
                    <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
            </Select>
             <Select value={dateFilter} onValueChange={(value) => {
                setDateFilter(value)
                setPage(1)
            }}>
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
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No transactions found matching your filters.
                      </TableCell>
                  </TableRow>
              ) : (
                  paginatedTransactions.map((t) => (
                  <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.description}</TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {t.type === 'transfer'
                            ? `${getAccountName(t.accountId)} → ${getAccountName(t.toAccountId)}`
                            : t.assetId
                                ? `${getAccountName(t.accountId)} → ${getAssetName(t.assetId)}`
                                : getAccountName(t.accountId)}
                      </TableCell>
                      <TableCell>{format(new Date(t.date), 'yyyy-MM-dd')}</TableCell>
                      <TableCell className={`text-right ${t.type === 'income' ? 'text-green-500' : isConsumptionExpense(t) ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {t.type === 'transfer' || isSavingsTransaction(t)
                          ? formatCurrency(Math.abs(t.amount), currency)
                          : <>{t.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(t.amount), currency)}</>}
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
            paginatedTransactions.map((t) => (
                <Card key={t.id} className="overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0 flex-1 truncate font-bold">{t.description}</div>
                            <div className={`shrink-0 whitespace-nowrap font-medium ${t.type === 'income' ? 'text-green-500' : isConsumptionExpense(t) ? 'text-red-500' : 'text-muted-foreground'}`}>
                                {t.type === 'transfer' || isSavingsTransaction(t)
                                    ? formatCurrency(Math.abs(t.amount), currency)
                                    : <>{t.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(t.amount), currency)}</>}
                            </div>
                        </div>
                        <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                            <span>{format(new Date(t.date), 'MMM dd, yyyy')}</span>
                            <span>•</span>
                            <span className="min-w-0 max-w-full truncate capitalize">{t.category}</span>
                        </div>
                        <div className="flex justify-end border-t pt-3">
                             <TransactionActions transaction={t} />
                        </div>
                    </CardContent>
                </Card>
            ))
        )}
      </div>

      {filteredTransactions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredTransactions.length)} of {filteredTransactions.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage >= totalPages}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
