import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function DebtsWidget() {
    const { debts, currency } = useTransactionStore()

    const activeDebts = debts.filter(d => (d.status === 'active' || d.status === undefined) && d.remainingAmount > 0)

    const totalReceivable = activeDebts
        .filter(d => d.type === 'receivable')
        .reduce((acc, d) => acc + d.remainingAmount, 0)

    const totalPayable = activeDebts
        .filter(d => d.type === 'payable')
        .reduce((acc, d) => acc + d.remainingAmount, 0)

    const netPosition = totalReceivable - totalPayable

    return (
        <Card className="col-span-1 md:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    Debts Monitor
                </CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
                    <Link to="/debts">
                        Manage <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-500/10 p-2 rounded-lg">
                        <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
                            <ArrowDownLeft className="h-3 w-3" /> Recv.
                        </div>
                        <div className="text-lg font-bold text-green-700 dark:text-green-500">
                            {formatCurrency(totalReceivable, currency)}
                        </div>
                    </div>
                    <div className="bg-red-500/10 p-2 rounded-lg">
                        <div className="flex items-center gap-1 text-xs text-red-600 mb-1">
                            <ArrowUpRight className="h-3 w-3" /> Payable
                        </div>
                        <div className="text-lg font-bold text-red-700 dark:text-red-500">
                            {formatCurrency(totalPayable, currency)}
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Net Position:</span>
                        <span className={`font-bold ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {netPosition >= 0 ? "+" : ""}{formatCurrency(netPosition, currency)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
