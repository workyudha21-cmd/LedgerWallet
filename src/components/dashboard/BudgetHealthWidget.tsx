import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { formatCompactNumber } from "@/lib/utils"
import { PieChart, ArrowRight, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { Cell, Pie, PieChart as RechartsPie, ResponsiveContainer } from "recharts"

export function BudgetHealthWidget() {
    const { budgets, transactions } = useTransactionStore()

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    // 1. Total Budget
    const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0)

    if (totalBudget === 0) {
        return (
            <Card className="col-span-1 md:col-span-3">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                        Budget Health
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
                        <Link to="/budget">Manage <ArrowRight className="ml-1 h-3 w-3" /></Link>
                    </Button>
                </CardHeader>
                <CardContent className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                    No active budgets set.
                </CardContent>
            </Card>
        )
    }

    // 2. Total Spent in Budgeted Categories
    const budgetedCategories = new Set(budgets.map(b => b.category))
    const totalSpent = transactions
        .filter(t =>
            t.type === 'expense' &&
            budgetedCategories.has(t.category) &&
            new Date(t.date).getMonth() === currentMonth &&
            new Date(t.date).getFullYear() === currentYear
        )
        .reduce((acc, t) => acc + t.amount, 0)

    const percentage = Math.min((totalSpent / totalBudget) * 100, 100)
    const remaining = Math.max(0, totalBudget - totalSpent)

    const data = [
        { name: "Spent", value: totalSpent, color: percentage > 100 ? "#ef4444" : percentage > 85 ? "#eab308" : "#22c55e" },
        { name: "Remaining", value: remaining, color: "#e2e8f0" }
    ]

    return (
        <Card className="col-span-1 md:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                    Budget Health
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
                    <Link to="/budget">Manage <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
                <div className="h-[80px] w-[80px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                            <Pie
                                data={data}
                                innerRadius={25}
                                outerRadius={35}
                                paddingAngle={2}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                        </RechartsPie>
                    </ResponsiveContainer>
                </div>
                <div className="space-y-1">
                    <div className="text-2xl font-bold">
                        {Math.round(percentage)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {totalSpent > totalBudget ? (
                            <span className="text-red-600 font-medium flex items-center">
                                Over Budget <TrendingUp className="ml-1 h-3 w-3" />
                            </span>
                        ) : (
                            <span className="text-green-600 font-medium flex items-center">
                                On Track <TrendingDown className="ml-1 h-3 w-3" />
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Left: {formatCompactNumber(remaining)}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
