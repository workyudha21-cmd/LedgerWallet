import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils"

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#2563eb", // Blue 600
  "#0891b2", // Cyan 600
  "#059669", // Emerald 600
  "#d97706", // Amber 600
  "#dc2626", // Red 600
]

export function ExpensePieChart() {
  const { transactions, currency } = useTransactionStore()

  // Filter expenses and aggregate by category
  const expenseData = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => {
      const existing = acc.find((item) => item.name === curr.category)
      if (existing) {
        existing.value += Math.abs(curr.amount)
      } else {
        acc.push({ name: curr.category, value: Math.abs(curr.amount) })
      }
      return acc
    }, [] as { name: string; value: number }[])

  return (
    <Card className="col-span-4 md:col-span-3 hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>Expense Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        {expenseData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No expense data available.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60} // Donut chart for cleaner look
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, currency)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
              {expenseData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-1">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </>
        )}

      </CardContent>
    </Card>
  )
}
