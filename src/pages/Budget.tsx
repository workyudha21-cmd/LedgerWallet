import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { cn, formatCurrency, formatCompactNumber } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Plus, Trash, Wallet, Edit2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { addMonths, format, subMonths } from "date-fns"
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
import { getConsumptionAmount, isConsumptionExpense } from "@/lib/transaction-utils"
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts"

export function Budget() {
    const { budgets, transactions, currency, categories, addBudget, removeBudget } = useTransactionStore()
    const user = useAuthStore((state) => state.user)

    // State for Add/Edit Dialog
    const [open, setOpen] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [category, setCategory] = useState("")
    const [amount, setAmount] = useState("")
    const [formError, setFormError] = useState("")

    const today = new Date()
    const currentMonthKey = format(today, "yyyy-MM")
    const oldestMonthKey = format(subMonths(today, 23), "yyyy-MM")
    const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)
    const selectedDate = new Date(
        Number(selectedMonth.slice(0, 4)),
        Number(selectedMonth.slice(5, 7)) - 1,
        1
    )
    const selectedMonthLabel = format(selectedDate, "MMMM yyyy")
    const selectedMonthNumber = selectedDate.getMonth()
    const selectedYear = selectedDate.getFullYear()
    const monthOptions = Array.from({ length: 24 }, (_, index) => subMonths(today, index))

    const expensesByCategory = transactions.reduce((acc, t) => {
        const tDate = new Date(t.date)
        if (
            isConsumptionExpense(t) &&
            tDate.getMonth() === selectedMonthNumber &&
            tDate.getFullYear() === selectedYear
        ) {
            acc[t.category] = (acc[t.category] || 0) + getConsumptionAmount(t)
        }
        return acc
    }, {} as Record<string, number>)

    // 2. Prepare Data for Chart & List
    // We want to show ALL budgets, plus potentially categories that have spending but NO budget (as "Unbudgeted" or alert?)
    // For now, let's focus on defined budgets + categories with high spending.

    const budgetData = budgets.map(b => {
        const spent = expensesByCategory[b.category] || 0
        const rawPercentage = b.amount > 0 ? (spent / b.amount) * 100 : (spent > 0 ? 100 : 0)
        return {
            ...b,
            spent,
            remaining: b.amount - spent,
            percentage: Math.min(rawPercentage, 100),
            rawPercentage
        }
    }).sort((a, b) => b.rawPercentage - a.rawPercentage) // Sort by highest % usage

    // 3. Metrics
    const totalBudget = budgets.reduce((acc, b) => acc + b.amount, 0)
    const totalSpentInBudgets = budgetData.reduce((acc, b) => acc + b.spent, 0)
    const totalSpentAll = Object.values(expensesByCategory).reduce((acc, val) => acc + val, 0)
    const unbudgetedSpend = totalSpentAll - totalSpentInBudgets

    const budgetedCategories = new Set(budgets.map(b => b.category))
    const budgetHistory = Array.from({ length: 6 }, (_, index) => {
        const date = subMonths(today, 5 - index)
        const spent = transactions.reduce((sum, transaction) => {
            const transactionDate = new Date(transaction.date)
            return isConsumptionExpense(transaction) &&
                budgetedCategories.has(transaction.category) &&
                transactionDate.getMonth() === date.getMonth() &&
                transactionDate.getFullYear() === date.getFullYear()
                ? sum + getConsumptionAmount(transaction)
                : sum
        }, 0)
        const percentage = totalBudget > 0 ? (spent / totalBudget) * 100 : 0

        return {
            key: format(date, "yyyy-MM"),
            label: format(date, "MMM yyyy"),
            spent,
            percentage,
        }
    })

    // 4. Form Handlers
    const customExpenses = categories
        .filter(c => c.type === 'expense')
        .map(c => c.name)
    const allCategories = Array.from(new Set([...EXPENSE_CATEGORIES, ...customExpenses])).sort()

    const handleSave = async () => {
        if (!user) return

        const parsedAmount = parseInt(amount.replace(/\D/g, ""), 10)

        if (!category) {
            setFormError("Please select a category.")
            return
        }

        if (!parsedAmount || parsedAmount <= 0) {
            setFormError("Monthly limit must be greater than 0.")
            return
        }

        setFormError("")
        await addBudget({ category, amount: parsedAmount }, user.uid)

        setOpen(false)
        setEditId(null)
        setCategory("")
        setAmount("")
    }

    const openEdit = (b: typeof budgetData[0]) => {
        setCategory(b.category)
        setAmount(b.amount.toString())
        setEditId(b.id)
        setFormError("")
        setOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Budget Planner</h2>
                    <p className="text-muted-foreground">Track your monthly spending limits for {selectedMonthLabel}.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            aria-label="Previous month"
                            disabled={selectedMonth <= oldestMonthKey}
                            onClick={() => setSelectedMonth(format(subMonths(selectedDate, 1), "yyyy-MM"))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-[170px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {monthOptions.map((date) => {
                                    const key = format(date, "yyyy-MM")
                                    return (
                                        <SelectItem key={key} value={key}>
                                            {format(date, "MMMM yyyy")}
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            aria-label="Next month"
                            disabled={selectedMonth >= currentMonthKey}
                            onClick={() => setSelectedMonth(format(addMonths(selectedDate, 1), "yyyy-MM"))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button onClick={() => { setEditId(null); setCategory(""); setAmount(""); setFormError(""); setOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Set New Budget
                    </Button>
                </div>
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

            {budgets.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                        <Wallet className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">No budgets yet</p>
                        <p className="text-sm text-muted-foreground">
                            Set a monthly limit for a category to start tracking your spending.
                        </p>
                        <Button
                            className="mt-2"
                            onClick={() => { setEditId(null); setCategory(""); setAmount(""); setFormError(""); setOpen(true); }}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Set New Budget
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Chart Section */}
            {budgetData.length > 0 && (
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Budget vs Actual</CardTitle>
                        <CardDescription>Spending per category in {selectedMonthLabel}</CardDescription>
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
                                <Bar dataKey="amount" name="Budget" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={12} />
                                <Bar dataKey="spent" name="Spent" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={12}>
                                    {budgetData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.spent > entry.amount ? "#ef4444" : "#22c55e"} />
                                    ))}
                                </Bar>
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* History */}
            {budgets.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Budget History</CardTitle>
                        <CardDescription>
                            Last 6 months against your current total budget. Select a month to review it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {budgetHistory.map((month) => {
                            const indicatorClass = month.percentage > 100
                                ? "bg-red-500"
                                : month.percentage > 80
                                    ? "bg-yellow-500"
                                    : "bg-green-500"

                            return (
                                <button
                                    key={month.key}
                                    type="button"
                                    onClick={() => setSelectedMonth(month.key)}
                                    className={cn(
                                        "w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                                        month.key === selectedMonth && "border-primary/40 bg-muted/50"
                                    )}
                                >
                                    <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                                        <span className="font-medium">{month.label}</span>
                                        <span className={`text-left sm:text-right ${month.percentage > 100 ? "text-red-600" : "text-muted-foreground"}`}>
                                            {formatCurrency(month.spent, currency)} / {formatCurrency(totalBudget, currency)}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Progress
                                            value={Math.min(month.percentage, 100)}
                                            className="h-1.5 flex-1"
                                            indicatorClassName={indicatorClass}
                                        />
                                        <span className="w-10 text-right text-xs text-muted-foreground">
                                            {Math.round(month.percentage)}%
                                        </span>
                                    </div>
                                </button>
                            )
                        })}
                    </CardContent>
                </Card>
            )}

            {/* Detailed List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {budgetData.map((budget) => {
                    let colorClass = "bg-green-500"
                    if (budget.rawPercentage > 100) colorClass = "bg-red-500"
                    else if (budget.rawPercentage > 80) colorClass = "bg-yellow-500"

                    return (
                        <Card key={budget.id} className="relative overflow-hidden group hover:shadow-lg transition-all">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass}`} />
                            <CardHeader className="pb-2 pl-6">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <CardTitle className="truncate text-lg">{budget.category}</CardTitle>
                                        <CardDescription>{formatCurrency(budget.amount, currency)} Limit</CardDescription>
                                    </div>
                                    <div className="flex shrink-0 gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
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
                                            {Math.round(budget.rawPercentage)}%
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
                            Set a monthly spending limit for a specific category. The limit applies to every month.
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
                        {formError && (
                            <p className="text-sm text-destructive">{formError}</p>
                        )}
                        <Button onClick={handleSave}>Save Budget</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
