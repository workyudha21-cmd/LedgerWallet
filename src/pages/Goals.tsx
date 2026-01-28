import { AddGoalDialog } from "@/components/goals/AddGoalDialog"
import { ContributeDialog } from "@/components/goals/ContributeDialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { Trash, Target, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"

export function Goals() {
  const { goals, currency, deleteGoal } = useTransactionStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const sorted = [...goals].sort((a, b) => {
      // Sort by completeness (percentage) or deadline?
      // Let's sort by deadline first (nulls last), then creation... 
      // Actually simply alphabetical or creation is fine. 
      // Let's do simple alphabetical for now.
      return a.name.localeCompare(b.name)
  })

  // Calculate total progress
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const totalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  const handleDelete = () => {
      if (deleteId) {
          deleteGoal(deleteId)
          setDeleteId(null)
      }
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Financial Goals</h2>
            <p className="text-muted-foreground">Track your savings for the future.</p>
        </div>
        <div className="flex items-center w-full md:w-auto">
            <AddGoalDialog />
        </div>
      </div>

      {/* Summary Card */}
      {goals.length > 0 && (
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 border-none text-white shadow-lg">
              <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                      <div>
                          <p className="text-indigo-100 font-medium">Total Saved</p>
                          <h3 className="text-3xl font-bold">{formatCurrency(totalSaved, currency)}</h3>
                      </div>
                      <Target className="h-10 w-10 text-indigo-200 opacity-50" />
                  </div>
                  <div className="space-y-2">
                      <div className="flex justify-between text-sm text-indigo-100">
                          <span>Overall Progress</span>
                          <span>{totalProgress.toFixed(1)}% of {formatCurrency(totalTarget, currency)}</span>
                      </div>
                      <Progress value={totalProgress} className="h-2 bg-indigo-900/30" indicatorClassName="bg-white" />
                  </div>
              </CardContent>
          </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map(goal => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100
            
            return (
                <Card key={goal.id}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg font-bold">{goal.name}</CardTitle>
                                {goal.deadline && (
                                    <CardDescription>
                                        Target: {format(new Date(goal.deadline), "PP")}
                                    </CardDescription>
                                )}
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                                onClick={() => setDeleteId(goal.id)}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <div className="mb-2 space-y-1">
                                <span className="text-2xl font-bold block truncate" title={formatCurrency(goal.currentAmount, currency)}>
                                    {formatCurrency(goal.currentAmount, currency)}
                                </span>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Saved</span>
                                    <span className="truncate max-w-[150px]" title={formatCurrency(goal.targetAmount, currency)}>
                                        Target: {formatCurrency(goal.targetAmount, currency)}
                                    </span>
                                </div>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <div className="mt-1 text-xs text-right text-muted-foreground">
                                {progress.toFixed(1)}%
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                             <ContributeDialog 
                                goal={goal} 
                                trigger={
                                    <Button size="sm" className="w-full">
                                        <TrendingUp className="mr-2 h-4 w-4" /> Add Funds
                                    </Button>
                                }
                             />
                        </div>
                    </CardContent>
                </Card>
            )
        })}

        {goals.length === 0 && (
            <div className="col-span-full text-center py-10 text-muted-foreground">
                No goals yet. Create one to start saving!
            </div>
        )}
      </div>

       <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete "{goals.find(g => g.id === deleteId)?.name}".
                        The money you contributed will NOT be refunded to your accounts automatically.
                        (The transactions remain as historical records).
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
