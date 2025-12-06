import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { useTransactionStore } from "@/lib/store"
import { format, subMonths } from "date-fns"
import { formatCurrency } from "@/lib/utils"

export function OverviewChart() {
  const { transactions, currency } = useTransactionStore()

  // Generate last 6 months data
  const data = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), i)
    const monthStr = format(date, "MMM")
    const monthYear = format(date, "yyyy-MM")

    const monthTransactions = transactions.filter(t => t.date.startsWith(monthYear))
    const total = monthTransactions.reduce((acc, t) => {
        return acc + (t.type === 'income' ? t.amount : -t.amount)
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
              tickFormatter={(value) => formatCurrency(value, currency)}
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
