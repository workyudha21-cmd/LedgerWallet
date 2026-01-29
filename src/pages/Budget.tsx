import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { formatCurrency, formatCompactNumber } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Plus, Trash, Wallet, Edit2, AlertCircle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
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
import { useState } from "react"
import { EXPENSE_CATEGORIES } from "@/lib/constants"
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

export function Budget() {
    const { budgets, transactions, currency, categories, addBudget, removeBudget } = useTransactionStore()
    const user = useAuthStore((state) => state.user)

    // State for Add/Edit Dialog
    const [open, setOpen] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [category, setCategory] = useState("")
    const [amount, setAmount] = useState("")

    // 1. Calculate Spent for Current Month
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

    // 2. Prepare Data for Chart & List
    // We want to show ALL budgets, plus potentially categories that have spending but NO budget (as "Unbudgeted" or alert?)
    // For now, let's focus on defined budgets + categories with high spending.

    const budgetData = budgets.map(b => {
        const spent = expensesByCategory[b.category] || 0
        const percentage = Math.min((spent / b.amount) * 100, 100)
        return {
            ...b,
            spent,
            remaining: b.amount - spent,
            percentage
        }
    }).sort((a, b) => b.percentage - a.percentage) // Sort by highest % usage

    // 3. Metrics
    const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0)
    const totalSpentInBudgets = budgetData.reduce((acc, b) => acc + b.spent, 0)
    const totalSpentAll = Object.values(expensesByCategory).reduce((acc, val) => acc + val, 0)
    const unbudgetedSpend = totalSpentAll - totalSpentInBudgets

    // 4. Form Handlers
    const customExpenses = categories
        .filter(c => c.type === 'expense')
        .map(c => c.name)
    const allCategories = Array.from(new Set([...EXPENSE_CATEGORIES, ...customExpenses])).sort()

    const handleSave = async () => {
        if (!user || !category || !amount) return

        await addBudget({
            category,
            amount: parseInt(amount.replace(/\D/g, ""), 10)
        }, user.uid)

        setOpen(false)
        setEditId(null)
        setCategory("")
        setAmount("")
    }

    const openEdit = (b: typeof budgetData[0]) => {
        setCategory(b.category)
        setAmount(b.amount.toString())
        setEditId(b.id)
        setOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Budget Planner</h2>
                    <p className="text-muted-foreground">Track your monthly spending limits.</p>
                </div>
                <Button onClick={() => { setEditId(null); setCategory(""); setAmount(""); setOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Set New Budget
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalBudget, currency)}</div>
                        <p className="text-xs text-muted-foreground">
                            For {budgetData.length} categories
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        <div className={`h-2 w-2 rounded-full ${totalSpentInBudgets > totalBudget ? 'bg-red-500' : 'bg-green-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalSpentInBudgets, currency)}</div>
                        <p className="text-xs text-muted-foreground">
                            {totalSpentInBudgets > totalBudget ? "Over Budget" : "Within Budget"}
                            {unbudgetedSpend > 0 && ` (+${formatCompactNumber(unbudgetedSpend)} unbudgeted)`}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(Math.max(0, totalBudget - totalSpentInBudgets), currency)}</div>
                        <p className="text-xs text-muted-foreground">
                            Available to spend
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Chart Section */}
            {budgetData.length > 0 && (
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Budget vs Actual</CardTitle>
                        <CardDescription>Spending per category this month</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={budgetData.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Category
                                                            </span>
                                                            <span className="font-bold text-muted-foreground">
                                                                {data.category}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                Spent / Budget
                                                            </span>
                                                            <span className="font-bold">
                                                                {formatCompactNumber(data.spent)} / {formatCompactNumber(data.amount)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="amount" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} stackId="a" />
                                <Bar dataKey="spent" radius={[0, 4, 4, 0]} barSize={20} stackId="a" className="-ml-[20px]">
                                    {budgetData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.spent > entry.amount ? "#ef4444" : "#22c55e"} />
                                    ))}
                                </Bar>
                                {/* We actually want grouped bars or stacked? 
                                    Let's try a simple trick: Just render 'spent' bar. 
                                    Wait, usually Budget vs Actual is side-by-side or overlay.
                                    Let's do separate bars for clarity, or just List View is enough?
                                    Actually the Chart might be redundant if the List has progress bars.
                                    Let's strictly show "Top Spenders" here.
                                */}
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Detailed List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {budgetData.map((budget) => {
                    let colorClass = "bg-green-500"
                    if (budget.percentage > 100) colorClass = "bg-red-500"
                    else if (budget.percentage > 80) colorClass = "bg-yellow-500"

                    return (
                        <Card key={budget.id} className="relative overflow-hidden group hover:shadow-lg transition-all">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass}`} />
                            <CardHeader className="pb-2 pl-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{budget.category}</CardTitle>
                                        <CardDescription>{formatCurrency(budget.amount, currency)} Limit</CardDescription>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(budget)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => removeBudget(budget.id)}
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pl-6 pt-2">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className={budget.spent > budget.amount ? "font-bold text-red-600" : ""}>
                                            {formatCurrency(budget.spent, currency)} spent
                                        </span>
                                        <span className="text-muted-foreground">
                                            {Math.round(budget.percentage)}%
                                        </span>
                                    </div>
                                    <Progress value={budget.percentage} className="h-2" indicatorClassName={colorClass} />
                                    {budget.remaining < 0 && (
                                        <div className="flex items-center gap-1 text-xs text-red-600 mt-2 font-medium">
                                            <AlertCircle className="h-3 w-3" />
                                            Over by {formatCurrency(Math.abs(budget.remaining), currency)}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editId ? "Edit Budget" : "Set New Budget"}</DialogTitle>
                        <DialogDescription>
                            Set a monthly spending limit for a specific category.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Select value={category} onValueChange={setCategory} disabled={!!editId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allCategories.map((cat) => (
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
                                placeholder="e.g. 1.000.000"
                                value={amount}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "")
                                    if (!val) { setAmount(""); return }
                                    const num = parseInt(val, 10)
                                    setAmount(new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US').format(num))
                                }}
                            />
                        </div>
                        <Button onClick={handleSave}>Save Budget</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
