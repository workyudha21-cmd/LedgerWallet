import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useTransactionStore, type Debt } from "@/lib/store"
import { buildAmortizationSchedule } from "@/lib/debt"
import { formatCompactNumber, formatCurrency } from "@/lib/utils"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CalendarClock } from "lucide-react"

interface DebtScheduleDialogProps {
    debt: Debt
    trigger?: React.ReactNode
}

export function DebtScheduleDialog({ debt, trigger }: DebtScheduleDialogProps) {
    const { currency } = useTransactionStore()
    const payment = debt.minimumPayment || 0
    const schedule = buildAmortizationSchedule(
        debt.remainingAmount,
        debt.interestRate,
        payment
    )

    const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0)
    const totalPayment = schedule.reduce((sum, row) => sum + row.payment, 0)
    const chartData = schedule.map(row => ({
        month: row.month,
        balance: row.balance,
    }))
    const visibleRows = schedule.slice(0, 12)

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <CalendarClock className="mr-2 h-4 w-4" /> Schedule
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>Amortization Schedule</DialogTitle>
                    <DialogDescription>
                        {debt.personName} · {formatCurrency(debt.remainingAmount, currency)} remaining
                    </DialogDescription>
                </DialogHeader>

                {payment <= 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Set a minimum monthly payment on this debt to generate an amortization schedule.
                    </p>
                ) : schedule.length === 0 ? (
                    <p className="text-sm text-destructive">
                        The minimum payment does not cover the monthly interest. Increase the payment to start reducing the balance.
                    </p>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-md border p-3">
                                <p className="text-xs text-muted-foreground">Months</p>
                                <p className="text-lg font-bold">{schedule.length}</p>
                            </div>
                            <div className="rounded-md border p-3">
                                <p className="text-xs text-muted-foreground">Total Interest</p>
                                <p className="text-lg font-bold">{formatCurrency(totalInterest, currency)}</p>
                            </div>
                            <div className="rounded-md border p-3">
                                <p className="text-xs text-muted-foreground">Total Payments</p>
                                <p className="text-lg font-bold">{formatCurrency(totalPayment, currency)}</p>
                            </div>
                        </div>

                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => formatCompactNumber(value)}
                                />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value, currency)}
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "var(--radius)",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="#6366f1"
                                    fill="#6366f1"
                                    fillOpacity={0.15}
                                />
                            </AreaChart>
                        </ResponsiveContainer>

                        <div className="max-h-[240px] overflow-y-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Month</TableHead>
                                        <TableHead className="text-right">Payment</TableHead>
                                        <TableHead className="text-right">Interest</TableHead>
                                        <TableHead className="text-right">Principal</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visibleRows.map((row) => (
                                        <TableRow key={row.month}>
                                            <TableCell>{row.month}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.payment, currency)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.interest, currency)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.principal, currency)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.balance, currency)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {schedule.length > visibleRows.length && (
                            <p className="text-xs text-muted-foreground">
                                Showing the first {visibleRows.length} of {schedule.length} months.
                            </p>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
