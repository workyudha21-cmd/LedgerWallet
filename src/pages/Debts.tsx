import { AddDebtDialog } from "@/components/debts/AddDebtDialog"
import { DebtPaymentDialog } from "@/components/debts/DebtPaymentDialog"
import { DebtPayoffCard } from "@/components/debts/DebtPayoffCard"
import { DebtScheduleDialog } from "@/components/debts/DebtScheduleDialog"
import { LIABILITY_TYPE_LABELS } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"
// import { format } from "date-fns"
import { Pencil, Trash, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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
import { format } from "date-fns"

export function Debts() {
    const { debts, assets, currency, deleteDebt } = useTransactionStore()
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const activeDebts = debts.filter(d => (d.status === 'active' || d.status === undefined) && d.remainingAmount > 0)
    const historyDebts = debts.filter(d => d.status === 'paid' || d.remainingAmount <= 0)

    const payable = activeDebts.filter(d => d.type === 'payable')
    const receivable = activeDebts.filter(d => d.type === 'receivable')

    const handleDelete = () => {
        if (deleteId) {
            deleteDebt(deleteId)
            setDeleteId(null)
        }
    }

    const DebtCard = ({ debt, isHistory = false }: { debt: typeof debts[0], isHistory?: boolean }) => {
        const isPayable = debt.type === 'payable'
        const progress = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100
        const dueTimestamp = debt.dueDate ? new Date(debt.dueDate).getTime() : null
        const isOverdue = !isHistory && dueTimestamp !== null && dueTimestamp < new Date().getTime() && debt.remainingAmount > 0
        const linkedAsset = debt.assetId
            ? assets.find((asset) => asset.id === debt.assetId)
            : undefined
        const isCreditCard = debt.liabilityType === "creditCard" && Boolean(debt.creditLimit)
        const utilization = isCreditCard && debt.creditLimit
            ? (debt.remainingAmount / debt.creditLimit) * 100
            : null

        return (
            <Card className="relative overflow-hidden">
                {isHistory && (
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <CheckCircle2 className="h-24 w-24" />
                    </div>
                )}
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <Badge variant={isPayable ? "destructive" : "default"} className={isPayable ? "bg-red-100 text-red-800 hover:bg-red-100" : "bg-green-100 text-green-800 hover:bg-green-100"}>
                                    {isPayable ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownLeft className="h-3 w-3 mr-1" />}
                                    {isPayable ? "I Owe" : "Owed to Me"}
                                </Badge>
                                <CardTitle className="break-words text-lg font-bold">{debt.personName}</CardTitle>
                                {isOverdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                            </div>
                            {debt.dueDate && (
                                <CardDescription className={isOverdue ? "text-red-500 font-medium" : ""}>
                                    Due: {format(new Date(debt.dueDate), "PP")}
                                </CardDescription>
                            )}
                            {isPayable && debt.liabilityType && (
                                <CardDescription>
                                    {LIABILITY_TYPE_LABELS[debt.liabilityType]}
                                    {linkedAsset ? ` · ${linkedAsset.name}` : ""}
                                </CardDescription>
                            )}
                            {debt.description && (
                                <p className="text-sm text-muted-foreground italic">"{debt.description}"</p>
                            )}
                        </div>
                        {!isHistory && (
                            <div className="flex shrink-0 gap-1">
                                <AddDebtDialog
                                    debt={debt}
                                    trigger={
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    }
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                                    onClick={() => setDeleteId(debt.id)}
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Remaining</p>
                                <span className="text-2xl font-bold">{formatCurrency(debt.remainingAmount, currency)}</span>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="text-xs text-muted-foreground">Total</p>
                                <span className="font-medium">{formatCurrency(debt.totalAmount, currency)}</span>
                            </div>
                        </div>
                        <Progress value={progress} className="h-2" />
                        {!!debt.minimumPayment && (
                            <p className="text-xs text-muted-foreground">
                                Min. payment: {formatCurrency(debt.minimumPayment, currency)}
                            </p>
                        )}
                        {!!debt.interestRate && (
                            <p className="text-xs text-muted-foreground">
                                Interest: {debt.interestRate}% p.a.
                            </p>
                        )}
                        {utilization !== null && (
                            <div className="space-y-1 pt-1">
                                <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:justify-between">
                                    <span>Credit utilization</span>
                                    <span className="text-left sm:text-right">
                                        {utilization.toFixed(0)}% of {formatCurrency(debt.creditLimit || 0, currency)}
                                    </span>
                                </div>
                                <Progress
                                    value={Math.min(100, utilization)}
                                    className="h-2"
                                    indicatorClassName={
                                        utilization < 30
                                            ? "bg-emerald-500"
                                            : utilization < 50
                                                ? "bg-yellow-500"
                                                : "bg-red-500"
                                    }
                                />
                            </div>
                        )}
                    </div>

                    {!isHistory && (
                        <div className="flex flex-wrap justify-end gap-2 pt-2">
                            {isPayable && !!debt.minimumPayment && (
                                <DebtScheduleDialog
                                    debt={debt}
                                    trigger={
                                        <Button size="sm" variant="outline">
                                            Schedule
                                        </Button>
                                    }
                                />
                            )}
                            <DebtPaymentDialog
                                debt={debt}
                                trigger={
                                    <Button size="sm" variant={isPayable ? "default" : "secondary"}>
                                        {isPayable ? "Pay Debt" : "Record Payment"}
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Debts & Loans</h2>
                    <p className="text-muted-foreground">Manage your payables and receivables.</p>
                </div>
                <div className="flex items-center w-full md:w-auto">
                    <AddDebtDialog />
                </div>
            </div>

            <DebtPayoffCard />

            <Tabs defaultValue="active" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="active">Active Debts</TabsTrigger>
                    <TabsTrigger value="history">History (Paid)</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-6">
                    {/* Receivables Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <ArrowDownLeft className="h-5 w-5 text-green-500" />
                            Owed to Me (Piutang)
                        </h3>
                        {receivable.length === 0 ? (
                            <p className="text-sm text-muted-foreground pl-4">No active receivables.</p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {receivable.map(d => <DebtCard key={d.id} debt={d} />)}
                            </div>
                        )}
                    </div>

                    {/* Payables Section */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <ArrowUpRight className="h-5 w-5 text-red-500" />
                            I Owe (Hutang)
                        </h3>
                        {payable.length === 0 ? (
                            <p className="text-sm text-muted-foreground pl-4">No active debts.</p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {payable.map(d => <DebtCard key={d.id} debt={d} />)}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <div className="mb-4 text-sm text-muted-foreground bg-muted/50 p-2 rounded border">
                        Only fully paid debts (Remaining Amount: 0) appear here.
                    </div>
                    {historyDebts.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No history found.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {historyDebts.map(d => <DebtCard key={d.id} debt={d} isHistory />)}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the debt record.
                            Note: Any payments already recorded as transactions will remain in your transaction history.
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
