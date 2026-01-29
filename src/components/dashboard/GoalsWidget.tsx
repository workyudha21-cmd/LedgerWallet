import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Target, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function GoalsWidget() {
    const { goals, currency } = useTransactionStore()

    // Get top 3 active goals (not reached)
    const activeGoals = goals
        .filter(g => g.currentAmount < g.targetAmount)
        .slice(0, 3)

    return (
        <Card className="col-span-1 md:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    Active Goals
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
                    <Link to="/goals">
                        View All <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {activeGoals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active goals found.</p>
                ) : (
                    activeGoals.map(goal => {
                        const progress = (goal.currentAmount / goal.targetAmount) * 100
                        return (
                            <div key={goal.id} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{goal.name}</span>
                                    <span className="text-muted-foreground">{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{formatCurrency(goal.currentAmount, currency)}</span>
                                    <span>of {formatCurrency(goal.targetAmount, currency)}</span>
                                </div>
                            </div>
                        )
                    })
                )}
            </CardContent>
        </Card>
    )
}
