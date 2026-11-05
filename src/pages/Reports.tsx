import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { formatCompactNumber, formatCurrency } from "@/lib/utils"
import { format, subMonths } from "date-fns"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ExportButton } from "@/components/common/ExportButton"
import { Progress } from "@/components/ui/progress"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ArrowDownIcon, ArrowUpIcon, Scale } from "lucide-react"

interface CategoryTotal {
  name: string
  value: number
}

export function Reports() {
  const { transactions, currency } = useTransactionStore()
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"))

  const monthOptions = Array.from({ length: 12 }).map((_, index) => {
    const date = subMonths(new Date(), index)
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    }
  })

  const monthTransactions = transactions.filter((transaction) => {
    if (transaction.type === "transfer") return false
    return format(new Date(transaction.date), "yyyy-MM") === selectedMonth
  })

  const totalIncome = monthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const totalExpense = monthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const net = totalIncome - totalExpense

  const groupByCategory = (type: "income" | "expense"): CategoryTotal[] =>
    Object.entries(
      monthTransactions
        .filter((transaction) => transaction.type === type)
        .reduce((acc, transaction) => {
          acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount
          return acc
        }, {} as Record<string, number>)
    )
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

  const expenseByCategory = groupByCategory("expense")
  const incomeByCategory = groupByCategory("income")

  const trendData = Array.from({ length: 6 }).map((_, index) => {
    const date = subMonths(new Date(), index)
    const monthKey = format(date, "yyyy-MM")
    const monthItems = transactions.filter(
      (transaction) => format(new Date(transaction.date), "yyyy-MM") === monthKey
    )

    return {
      name: format(date, "MMM"),
      income: monthItems
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      expense: monthItems
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    }
  }).reverse()

  const renderCategoryBreakdown = (
    title: string,
    data: CategoryTotal[],
    total: number,
    indicatorClassName: string
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>
          {data.length === 0 ? "No data for this period." : `${data.length} categories`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="text-muted-foreground">{formatCurrency(item.value, currency)}</span>
            </div>
            <Progress
              value={total > 0 ? (item.value / total) * 100 : 0}
              className="h-2"
              indicatorClassName={indicatorClassName}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">Review your income and spending by month.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportButton transactions={monthTransactions} currency={currency} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {formatCurrency(totalIncome, currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(totalExpense, currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${net >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {net >= 0 ? "+" : ""}{formatCurrency(net, currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
          <CardDescription>Last 6 months</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCompactNumber(value)}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                formatter={(value: number) => formatCurrency(value, currency)}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {renderCategoryBreakdown("Expenses by Category", expenseByCategory, totalExpense, "bg-red-500")}
        {renderCategoryBreakdown("Income by Category", incomeByCategory, totalIncome, "bg-emerald-500")}
      </div>
    </div>
  )
}
