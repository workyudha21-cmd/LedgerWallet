import { AddDebtDialog } from "@/components/debts/AddDebtDialog"
import { DebtPaymentDialog } from "@/components/debts/DebtPaymentDialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"
// import { format } from "date-fns"
import { Trash, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from "lucide-react"
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
    const { debts, currency, deleteDebt } = useTransactionStore()
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

        return (
            <Card className="relative overflow-hidden">
                {isHistory && (
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <CheckCircle2 className="h-24 w-24" />
                    </div>
                )}
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Badge variant={isPayable ? "destructive" : "default"} className={isPayable ? "bg-red-100 text-red-800 hover:bg-red-100" : "bg-green-100 text-green-800 hover:bg-green-100"}>
                                    {isPayable ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownLeft className="h-3 w-3 mr-1" />}
                                    {isPayable ? "I Owe" : "Owed to Me"}
                                </Badge>
                                <CardTitle className="text-lg font-bold">{debt.personName}</CardTitle>
                            </div>
                            {debt.dueDate && (
                                <CardDescription>
                                    Due: {format(new Date(debt.dueDate), "PP")}
                                </CardDescription>
                            )}
                            {debt.description && (
                                <p className="text-sm text-muted-foreground italic">"{debt.description}"</p>
                            )}
                        </div>
                        {!isHistory && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                                onClick={() => setDeleteId(debt.id)}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 space-y-2">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-muted-foreground">Remaining</p>
                                <span className="text-2xl font-bold">{formatCurrency(debt.remainingAmount, currency)}</span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Total</p>
                                <span className="font-medium">{formatCurrency(debt.totalAmount, currency)}</span>
                            </div>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {!isHistory && (
                        <div className="flex justify-end pt-2">
                            <DebtPaymentDialog
                                debt={debt}
                                trigger={
                                    <Button size="sm" className="w-full" variant={isPayable ? "default" : "secondary"}>
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
