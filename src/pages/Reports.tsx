import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { getConsumptionAmount, isConsumptionExpense, isSavingsTransaction } from "@/lib/transaction-utils"
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
  Line,
  LineChart,
  ReferenceLine,
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
  const { transactions, currency, healthSnapshots } = useTransactionStore()
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"))

  const monthOptions = Array.from({ length: 12 }).map((_, index) => {
    const date = subMonths(new Date(), index)
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    }
  })

  const monthTransactions = transactions.filter((transaction) => {
    if (transaction.type === "transfer" || isSavingsTransaction(transaction)) return false
    return format(new Date(transaction.date), "yyyy-MM") === selectedMonth
  })

  const totalIncome = monthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const totalExpense = monthTransactions
    .reduce((sum, transaction) => sum + getConsumptionAmount(transaction), 0)

  const net = totalIncome - totalExpense

  const groupByCategory = (type: "income" | "expense"): CategoryTotal[] =>
    Object.entries(
      monthTransactions
        .filter((transaction) => type === "expense" ? isConsumptionExpense(transaction) : transaction.type === type)
        .reduce((acc, transaction) => {
          acc[transaction.category] = (acc[transaction.category] || 0) + getConsumptionAmount(transaction)
          return acc
        }, {} as Record<string, number>)
    )
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)

  const expenseByCategory = groupByCategory("expense")
  const incomeByCategory = groupByCategory("income")

  const healthHistory = healthSnapshots.slice(-12).map((snapshot) => {
    const [year, month] = snapshot.month.split("-").map(Number)
    return {
      month: format(new Date(year, month - 1, 1), "MMM yy"),
      score: snapshot.score,
    }
  })

  const trendData = Array.from({ length: 6 }).map((_, index) => {
    const date = subMonths(new Date(), index)
    const monthKey = format(date, "yyyy-MM")
    const monthItems = transactions.filter(
      (transaction) =>
        transaction.type !== "transfer" &&
        !isSavingsTransaction(transaction) &&
        format(new Date(transaction.date), "yyyy-MM") === monthKey
    )

    return {
      name: format(date, "MMM"),
      income: monthItems
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      expense: monthItems
        .reduce((sum, transaction) => sum + getConsumptionAmount(transaction), 0),
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
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
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
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
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

      <Card>
        <CardHeader>
          <CardTitle>Financial Health History</CardTitle>
          <CardDescription>Monthly snapshots recorded from the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          {healthHistory.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              No health history yet. Open the dashboard to record a snapshot.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={healthHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: number) => [`${value}/100`, "Score"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="3 3" />
                <ReferenceLine y={60} stroke="#3b82f6" strokeDasharray="3 3" />
                <ReferenceLine y={40} stroke="#eab308" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {renderCategoryBreakdown("Expenses by Category", expenseByCategory, totalExpense, "bg-red-500")}
        {renderCategoryBreakdown("Income by Category", incomeByCategory, totalIncome, "bg-emerald-500")}
      </div>
    </div>
  )
}
