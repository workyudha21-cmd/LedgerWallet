import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTransactionStore } from "@/lib/store"
import { calculateNetWorth } from "@/lib/netWorth"
import { LIABILITY_TYPE_LABELS } from "@/lib/constants"
import { formatCompactNumber, formatCurrency } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { Car, Home, Scale, TrendingDown, TrendingUp, Wallet } from "lucide-react"

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
    const { accounts, assets, goals, debts, healthSnapshots, currency } = useTransactionStore()
    const breakdown = calculateNetWorth(accounts, assets, goals, debts)

    const includedAccounts = accounts.filter(a => a.includeInNetWorth !== false)
    const excludedAccounts = accounts.filter(a => a.includeInNetWorth === false)
    const includedAssets = assets.filter(a => a.includeInNetWorth !== false)
    const excludedAssets = assets.filter(a => a.includeInNetWorth === false)
    const activeDebts = debts.filter(d => d.status !== 'paid' && d.remainingAmount > 0)
    const payables = activeDebts.filter(d => d.type === 'payable')
    const receivables = activeDebts.filter(d => d.type === 'receivable')

    const accountTypeTotals = includedAccounts.reduce((acc, account) => {
        acc[account.type] = (acc[account.type] || 0) + (account.balance || 0)
        return acc
    }, {} as Record<string, number>)

    const assetCategoryTotals = includedAssets.reduce((acc, asset) => {
        acc[asset.category] = (acc[asset.category] || 0) + (asset.currentValue || 0)
        return acc
    }, {} as Record<string, number>)

    const negativeAccountTotal = includedAccounts
        .filter(account => (account.balance || 0) < 0)
        .reduce((sum, account) => sum + (account.balance || 0), 0)

    const assetData = [
        ...Object.entries(accountTypeTotals)
            .filter(([, value]) => value > 0)
            .map(([name, value]) => ({ name: `Account · ${name}`, value })),
        ...Object.entries(assetCategoryTotals)
            .filter(([, value]) => value > 0)
            .map(([name, value]) => ({ name: `Asset · ${name}`, value })),
        ...(breakdown.totalGoals > 0 ? [{ name: "Goals", value: breakdown.totalGoals }] : []),
        ...(breakdown.totalReceivables > 0 ? [{ name: "Receivables", value: breakdown.totalReceivables }] : []),
    ]

    const netWorthHistory = healthSnapshots.slice(-12).map((snapshot) => {
        const [year, month] = snapshot.month.split("-").map(Number)
        return {
            month: format(new Date(year, month - 1, 1), "MMM yy"),
            value: snapshot.netWorth,
        }
    })

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
                            payables.map((debt) => {
                                const linkedAsset = assets.find((asset) => asset.id === debt.assetId)
                                const utilization = debt.creditLimit
                                    ? (debt.remainingAmount / debt.creditLimit) * 100
                                    : null

                                return (
                                    <div key={debt.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-medium">{debt.personName}</p>
                                                {debt.liabilityType && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {LIABILITY_TYPE_LABELS[debt.liabilityType]}
                                                    </Badge>
                                                )}
                                            </div>
                                            {linkedAsset && (
                                                <p className="text-xs text-muted-foreground">
                                                    Asset: {linkedAsset.name}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                {debt.minimumPayment
                                                    ? `Min. payment ${formatCurrency(debt.minimumPayment, currency)}`
                                                    : "Minimum payment not set"}
                                                {debt.interestRate ? ` · ${debt.interestRate}% p.a.` : ""}
                                            </p>
                                            {utilization !== null && (
                                                <p className="text-xs text-muted-foreground">
                                                    Limit {formatCurrency(debt.creditLimit || 0, currency)} · Used {utilization.toFixed(0)}%
                                                </p>
                                            )}
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
                                )
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Asset Details</CardTitle>
                        <CardDescription>Current value, equity, and linked liabilities</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {includedAssets.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No assets recorded yet. Add one from the Assets page.
                            </p>
                        ) : (
                            includedAssets.map((asset) => {
                                const linkedDebt = payables
                                    .filter((debt) => debt.assetId === asset.id)
                                    .reduce((sum, debt) => sum + debt.remainingAmount, 0)
                                const equity = asset.currentValue - linkedDebt
                                const hasPurchasePrice = Boolean(asset.purchasePrice && asset.purchasePrice > 0)
                                const gain = hasPurchasePrice ? asset.currentValue - (asset.purchasePrice || 0) : null
                                const gainPercentage = hasPurchasePrice
                                    ? (gain! / (asset.purchasePrice || 1)) * 100
                                    : 0

                                return (
                                    <div key={asset.id} className="space-y-1 border-b pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                {asset.category === "Vehicle"
                                                    ? <Car className="h-4 w-4 text-muted-foreground" />
                                                    : asset.category === "Property"
                                                        ? <Home className="h-4 w-4 text-muted-foreground" />
                                                        : <TrendingUp className="h-4 w-4 text-muted-foreground" />}
                                                <div>
                                                    <p className="text-sm font-medium">{asset.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {asset.category}
                                                        {asset.valuationDate
                                                            ? ` · valued ${format(parseISO(asset.valuationDate), "PP")}`
                                                            : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{formatCurrency(asset.currentValue, currency)}</p>
                                                {gain !== null && (
                                                    <p className={`text-xs ${gain >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                                        {gain >= 0 ? "+" : ""}{formatCurrency(gain, currency)} ({gainPercentage.toFixed(1)}%)
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {linkedDebt > 0 && (
                                            <div className="flex justify-between pl-6 text-xs text-muted-foreground">
                                                <span>Linked debt: {formatCurrency(linkedDebt, currency)}</span>
                                                <span>Equity: {formatCurrency(equity, currency)}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Accounts</CardTitle>
                        <CardDescription>Cash, bank, wallet, and other accounts</CardDescription>
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
                        {negativeAccountTotal < 0 && (
                            <p className="text-xs text-muted-foreground">
                                Negative balances ({formatCurrency(negativeAccountTotal, currency)}) reduce total assets and are excluded from the composition chart.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Receivables & Excluded</CardTitle>
                    <CardDescription>Money owed to you and items outside net worth</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
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

                    <div className="space-y-2">
                        <p className="text-sm font-medium">Excluded Accounts</p>
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

                    <div className="space-y-2">
                        <p className="text-sm font-medium">Excluded Assets</p>
                        {excludedAssets.length === 0 ? (
                            <p className="text-sm text-muted-foreground">None.</p>
                        ) : (
                            excludedAssets.map((asset) => (
                                <div key={asset.id} className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{asset.name} ({asset.category})</span>
                                    <span className="text-muted-foreground">
                                        {formatCurrency(asset.currentValue, currency)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Net Worth History</CardTitle>
                    <CardDescription>Monthly snapshots recorded from the dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    {netWorthHistory.length === 0 ? (
                        <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
                            No history yet. Open the dashboard to record a snapshot.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={netWorthHistory}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis
                                    fontSize={12}
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
                                    dataKey="value"
                                    stroke="#6366f1"
                                    fill="#6366f1"
                                    fillOpacity={0.15}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
