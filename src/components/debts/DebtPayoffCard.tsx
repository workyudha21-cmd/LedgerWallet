import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { estimateDebtPayoff } from "@/lib/debt"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { AlertTriangle, CalendarCheck, Percent, Wallet } from "lucide-react"

export function DebtPayoffCard() {
    const { debts, currency } = useTransactionStore()
    const projection = estimateDebtPayoff(debts)

    if (projection.totalDebt <= 0) return null

    const debtFreeLabel = projection.debtFreeDate
        ? format(projection.debtFreeDate, "MMMM yyyy")
        : "—"

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Debt Payoff Projection</CardTitle>
                <CardDescription>
                    Estimated using current minimum payments only.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Wallet className="h-3 w-3" /> Total Debt
                        </p>
                        <p className="text-lg font-bold">
                            {formatCurrency(projection.totalDebt, currency)}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Monthly Minimum</p>
                        <p className="text-lg font-bold">
                            {formatCurrency(projection.totalMinimumPayment, currency)}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Percent className="h-3 w-3" /> Avg. Interest
                        </p>
                        <p className="text-lg font-bold">
                            {projection.weightedInterestRate.toFixed(1)}%
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarCheck className="h-3 w-3" /> Debt-Free Estimate
                        </p>
                        <p className="text-lg font-bold">{debtFreeLabel}</p>
                        {projection.months !== null && (
                            <p className="text-xs text-muted-foreground">
                                {projection.months} months
                            </p>
                        )}
                    </div>
                </div>

                {projection.hasMissingPayment && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>Set minimum payments for all active debts to estimate a debt-free date.</span>
                    </div>
                )}

                {projection.hasUnpayableDebt && (
                    <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>Minimum payments do not cover the interest on at least one debt. Increase the payment to avoid growing debt.</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
