import { Progress } from "@/components/ui/progress"
import { useTransactionStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"

export function BudgetProgress() {
  const { budgets, transactions, currency } = useTransactionStore()

  // Calculate current month's expenses per category
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const expensesByCategory = transactions.reduce((acc, t) => {
    const tDate = new Date(t.date)
    if (
        t.type === 'expense' && 
        tDate.getMonth() === currentMonth && 
        tDate.getFullYear() === currentYear
    ) {
        acc[t.category] = (acc[t.category] || 0) + t.amount
    }
    return acc
  }, {} as Record<string, number>)

  if (budgets.length === 0) return null

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Budget Status (This Month)</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
            const spent = expensesByCategory[budget.category] || 0
            const percentage = Math.min((spent / budget.amount) * 100, 100)
            
            let colorClass = "bg-green-500"
            if (percentage > 90) colorClass = "bg-red-500"
            else if (percentage > 75) colorClass = "bg-yellow-500"

            return (
                <div key={budget.id} className="p-4 border rounded-lg bg-card shadow-sm space-y-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold">{budget.category}</span>
                        <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" indicatorClassName={colorClass} />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Spent: {formatCurrency(spent, currency)}</span>
                        <span>Limit: {formatCurrency(budget.amount, currency)}</span>
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  )
}
