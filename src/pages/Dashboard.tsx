import { SummaryCards } from "@/components/dashboard/SummaryCards"
import { OverviewChart } from "@/components/dashboard/OverviewChart"
import { RecentTransactions } from "@/components/dashboard/RecentTransactions"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog"
import { ExpensePieChart } from "@/components/dashboard/ExpensePieChart"
import { GoalsWidget } from "@/components/dashboard/GoalsWidget"
import { DebtsWidget } from "@/components/dashboard/DebtsWidget"
import { BudgetHealthWidget } from "@/components/dashboard/BudgetHealthWidget"

export function Dashboard() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
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

      {/* Top Row: Summary Cards */}
      <SummaryCards />

      {/* Main Grid: Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* Left Column: Charts (8 cols) */}
        <div className="md:col-span-8 flex flex-col gap-4">
          <OverviewChart />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RecentTransactions />
            <ExpensePieChart />
          </div>
        </div>

        {/* Right Column: Widgets (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <BudgetHealthWidget />
          <GoalsWidget />
          <DebtsWidget />
        </div>

      </div>
    </div>
  )
}
