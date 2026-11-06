import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { calculateNetWorth } from "@/lib/netWorth"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Scale, TrendingDown, TrendingUp, Wallet } from "lucide-react"

const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "#2563eb",
    "#0891b2",
    "#059669",
    "#d97706",
    "#dc2626",
]

export function NetWorth() {
    const { accounts, goals, debts, currency } = useTransactionStore()
    const breakdown = calculateNetWorth(accounts, goals, debts)

    const includedAccounts = accounts.filter(a => a.includeInNetWorth !== false)
    const excludedAccounts = accounts.filter(a => a.includeInNetWorth === false)
    const activeDebts = debts.filter(d => d.status !== 'paid' && d.remainingAmount > 0)
    const payables = activeDebts.filter(d => d.type === 'payable')
    const receivables = activeDebts.filter(d => d.type === 'receivable')

    const accountTypeTotals = includedAccounts.reduce((acc, account) => {
        acc[account.type] = (acc[account.type] || 0) + (account.balance || 0)
        return acc
    }, {} as Record<string, number>)

    const negativeAccountTotal = includedAccounts
        .filter(account => (account.balance || 0) < 0)
        .reduce((sum, account) => sum + (account.balance || 0), 0)

    const assetData = [
        ...Object.entries(accountTypeTotals)
            .filter(([, value]) => value > 0)
            .map(([name, value]) => ({ name, value })),
        ...(breakdown.totalGoals > 0 ? [{ name: "Goals", value: breakdown.totalGoals }] : []),
        ...(breakdown.totalReceivables > 0 ? [{ name: "Receivables", value: breakdown.totalReceivables }] : []),
    ]

    return (
        <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Net Worth</h2>
                    <p className="text-muted-foreground">Assets, liabilities, and what is actually yours.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">
                            {formatCurrency(breakdown.totalAssets, currency)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Accounts, goals, and receivables
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                            {formatCurrency(breakdown.totalPayables, currency)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active payables
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
                        <Scale className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${breakdown.netWorth >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {formatCurrency(breakdown.netWorth, currency)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Assets minus liabilities
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Asset Composition</CardTitle>
                        <CardDescription>Accounts included in net worth</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {assetData.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No assets recorded yet.</p>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={assetData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {assetData.map((_, index) => (
                                                <Cell key={`asset-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value, currency)}
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--card))",
                                                borderColor: "hsl(var(--border))",
                                                borderRadius: "var(--radius)",
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                <div className="space-y-2">
                                    {assetData.map((item, index) => (
                                        <div key={item.name} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-2 w-2 rounded-full"
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                <span className="text-muted-foreground">{item.name}</span>
                                            </div>
                                            <span className="font-medium">{formatCurrency(item.value, currency)}</span>
                                        </div>
                                    ))}
                                </div>

                                {negativeAccountTotal < 0 && (
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        Negative balances ({formatCurrency(negativeAccountTotal, currency)}) reduce total assets and are excluded from the composition chart.
                                    </p>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Liabilities</CardTitle>
                        <CardDescription>Active payables</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {payables.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No active liabilities.</p>
                        ) : (
                            payables.map((debt) => (
                                <div key={debt.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                                    <div className="space-y-1">
                                        <p className="font-medium">{debt.personName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {debt.minimumPayment
                                                ? `Min. payment ${formatCurrency(debt.minimumPayment, currency)}`
                                                : "Minimum payment not set"}
                                            {debt.interestRate ? ` · ${debt.interestRate}% p.a.` : ""}
                                        </p>
                                        {debt.dueDate && (
                                            <p className="text-xs text-muted-foreground">
                                                Due {format(new Date(debt.dueDate), "PP")}
                                            </p>
                                        )}
                                    </div>
                                    <span className="font-semibold text-red-500">
                                        {formatCurrency(debt.remainingAmount, currency)}
                                    </span>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Included Assets</CardTitle>
                        <CardDescription>Accounts counted in net worth</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {includedAccounts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No accounts yet.</p>
                        ) : (
                            includedAccounts.map((account) => (
                                <div key={account.id} className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">{account.name}</p>
                                            <p className="text-xs text-muted-foreground">{account.type}</p>
                                        </div>
                                    </div>
                                    <span className="font-medium">{formatCurrency(account.balance, currency)}</span>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Receivables & Excluded</CardTitle>
                        <CardDescription>Money owed to you and accounts outside net worth</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Receivables</p>
                            {receivables.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No active receivables.</p>
                            ) : (
                                receivables.map((debt) => (
                                    <div key={debt.id} className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{debt.personName}</span>
                                        <span className="font-medium text-emerald-500">
                                            {formatCurrency(debt.remainingAmount, currency)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <p className="text-sm font-medium">Excluded from net worth</p>
                            {excludedAccounts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">None.</p>
                            ) : (
                                excludedAccounts.map((account) => (
                                    <div key={account.id} className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{account.name} ({account.type})</span>
                                        <span className="text-muted-foreground">
                                            {formatCurrency(account.balance, currency)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
