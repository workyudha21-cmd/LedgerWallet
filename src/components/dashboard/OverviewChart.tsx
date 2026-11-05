import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { useTransactionStore } from "@/lib/store"
import { format, subMonths } from "date-fns"
import { formatCurrency, formatCompactNumber } from "@/lib/utils"

export function OverviewChart() {
  const { transactions, currency } = useTransactionStore()

  // Generate last 6 months data
  const data = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), i)
    const monthStr = format(date, "MMM")

    const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date)
        return transactionDate.getFullYear() === date.getFullYear() &&
            transactionDate.getMonth() === date.getMonth()
    })
    const total = monthTransactions.reduce((acc, t) => {
        if (t.type === 'income') return acc + t.amount
        if (t.type === 'expense') return acc - t.amount
        return acc
    }, 0)

    return {
      name: monthStr,
      total: total,
    }
  }).reverse()

  return (
    <Card className="col-span-4 hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCompactNumber(value)}
            />
            <Tooltip 
                cursor={{fill: 'var(--muted)'}}
                formatter={(value: number) => [formatCurrency(value, currency), 'Net Balance']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
