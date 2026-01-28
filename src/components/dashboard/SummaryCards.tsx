import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, WalletIcon } from "lucide-react"
import { useTransactionStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"

export function SummaryCards() {
  const { transactions, accounts, currency } = useTransactionStore()

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0)

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0)

  // Calculate total balance from all accounts
  const balance = accounts.reduce((acc, account) => acc + Number(account.balance), 0)

  const cashFlow = income - expense

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <WalletIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(balance, currency)}</div>
          <p className="text-xs text-muted-foreground">Total Assets</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Income</CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-500">{formatCurrency(income, currency)}</div>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">{formatCurrency(expense, currency)}</div>
        </CardContent>
      </Card>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
          <div className={`h-4 w-4 rounded-full ${cashFlow >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${cashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {cashFlow >= 0 ? '+' : ''}{formatCurrency(cashFlow, currency)}
          </div>
          <p className="text-xs text-muted-foreground">Income - Expense</p>
        </CardContent>
      </Card>
    </div>
  )
}
