import { SummaryCards } from "@/components/dashboard/SummaryCards"
import { OverviewChart } from "@/components/dashboard/OverviewChart"
import { RecentTransactions } from "@/components/dashboard/RecentTransactions"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog"
import { ExpensePieChart } from "@/components/dashboard/ExpensePieChart"

export function Dashboard() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
            <AddTransactionDialog>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Transaction
                </Button>
            </AddTransactionDialog>
        </div>
      </div>
      <SummaryCards />
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
