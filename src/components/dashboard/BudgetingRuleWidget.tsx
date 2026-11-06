import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { calculateBudgetingRule } from "@/lib/budgeting"
import { formatCurrency } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Scale } from "lucide-react"

export function BudgetingRuleWidget() {
    const { transactions, debts, categories, currency } = useTransactionStore()
    const rule = calculateBudgetingRule(transactions, debts, categories)

    if (!rule.hasEnoughData) {
        return (
            <Card className="col-span-1 md:col-span-3">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        50 / 30 / 20 Rule
                    </CardTitle>
                    <CardDescription>Rolling 3-month average</CardDescription>
                </CardHeader>
                <CardContent className="p-6 text-sm text-muted-foreground">
                    Add income and expenses to see your needs, wants, and savings breakdown.
                </CardContent>
            </Card>
        )
    }

    const rows = [
        {
            label: "Needs",
            amount: rule.needs,
            ratio: rule.needsRatio,
            target: "≤ 50%",
            color: rule.needsRatio <= 50 ? "bg-emerald-500" : rule.needsRatio <= 60 ? "bg-yellow-500" : "bg-red-500",
        },
        {
            label: "Wants",
            amount: rule.wants,
            ratio: rule.wantsRatio,
            target: "≤ 30%",
            color: rule.wantsRatio <= 30 ? "bg-emerald-500" : rule.wantsRatio <= 40 ? "bg-yellow-500" : "bg-red-500",
        },
        {
            label: "Savings & Debt",
            amount: rule.savings,
            ratio: rule.savingsRatio,
            target: "≥ 20%",
            color: rule.savingsRatio >= 20 ? "bg-emerald-500" : rule.savingsRatio >= 10 ? "bg-yellow-500" : "bg-red-500",
        },
    ]

    return (
        <Card className="col-span-1 md:col-span-3">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    50 / 30 / 20 Rule
                </CardTitle>
                <CardDescription>Rolling 3-month average</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {rows.map((row) => (
                    <div key={row.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{row.label}</span>
                            <span className="text-muted-foreground">
                                {row.ratio.toFixed(0)}% <span className="text-[10px]">({row.target})</span>
                            </span>
                        </div>
                        <Progress
                            value={Math.min(100, Math.max(0, row.ratio))}
                            className="h-2"
                            indicatorClassName={row.color}
                        />
                        <div className="text-xs text-muted-foreground">
                            {formatCurrency(row.amount, currency)} / month
                        </div>
                    </div>
                ))}

                {rule.other > 0 && (
                    <p className="text-xs text-muted-foreground border-t pt-3">
                        Unclassified spending: {formatCurrency(rule.other, currency)} / month
                        ({rule.otherRatio.toFixed(0)}%). Assign categories in Settings for a complete 50/30/20 view.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
