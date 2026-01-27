import { SummaryCards } from "@/components/dashboard/SummaryCards"
import { OverviewChart } from "@/components/dashboard/OverviewChart"
import { RecentTransactions } from "@/components/dashboard/RecentTransactions"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog"
import { ExpensePieChart } from "@/components/dashboard/ExpensePieChart"
import { BudgetList } from "@/components/budget/BudgetList"
import { BudgetProgress } from "@/components/budget/BudgetProgress"

export function Dashboard() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
            <div className="hidden md:block">
                <AddTransactionDialog>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Transaction
                    </Button>
                </AddTransactionDialog>
            </div>
            
            {/* Mobile FAB */}
            <div className="md:hidden fixed bottom-6 right-6 z-50">
                <AddTransactionDialog>
                    <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
                        <Plus className="h-6 w-6" />
                        <span className="sr-only">Add Transaction</span>
                    </Button>
                </AddTransactionDialog>
            </div>
        </div>
      </div>
      <SummaryCards />
      
      {/* Budget Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-full">
            <BudgetList />
        </div>
        <div className="col-span-full">
            <BudgetProgress />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 h-full">
        <OverviewChart />
        <ExpensePieChart />
      </div>
       <div className="grid gap-4 grid-cols-1">
        <RecentTransactions />
      </div>
    </div>
  )
}
