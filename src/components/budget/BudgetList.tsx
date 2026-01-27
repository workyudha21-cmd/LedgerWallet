import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuthStore } from "@/lib/auth-store"
import { useTransactionStore } from "@/lib/store"
import { EXPENSE_CATEGORIES } from "@/lib/constants"
import { useState } from "react"
import { Plus, Trash } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export function BudgetList() {
  const { budgets, addBudget, removeBudget, currency } = useTransactionStore()
  const user = useAuthStore((state) => state.user)
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState("")

  const handleSave = async () => {
    if (!user || !category || !amount) return

    await addBudget({
        category,
        amount: Number(amount)
    }, user.uid)
    
    setOpen(false)
    setCategory("")
    setAmount("")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Monthly Budgets</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Set Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Monthly Budget</DialogTitle>
              <DialogDescription>
                Set a spending limit for a specific category.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Monthly Limit</Label>
                <Input
                  type="number"
                  placeholder="e.g. 1000000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <Button onClick={handleSave}>Save Budget</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {budgets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No budgets set yet.</p>
        ) : (
            budgets.map((budget) => (
                <div key={budget.id} className="flex items-center justify-between p-3 border rounded-lg bg-card text-card-foreground shadow-sm">
                    <div>
                        <div className="font-medium">{budget.category}</div>
                        <div className="text-sm text-muted-foreground">
                            Limit: {formatCurrency(budget.amount, currency)}
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeBudget(budget.id)}
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </div>
            ))
        )}
      </div>
    </div>
  )
}
