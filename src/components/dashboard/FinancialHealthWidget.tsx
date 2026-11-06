import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { calculateFinancialHealth } from "@/lib/financialHealth"
import { formatCurrency } from "@/lib/utils"
import { Activity, TrendingUp, AlertTriangle, ShieldCheck, CheckCircle2, Info } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useAuthStore } from "@/lib/auth-store"
import { format } from "date-fns"
import { useEffect, useMemo } from "react"

export function FinancialHealthWidget() {
    const { accounts, transactions, debts, goals, categories, financialTargets, currency } = useTransactionStore()
    const user = useAuthStore((state) => state.user)
    const saveHealthSnapshot = useTransactionStore((state) => state.saveHealthSnapshot)

    const health = calculateFinancialHealth(
        accounts,
        transactions,
        debts,
        goals,
        categories,
        financialTargets
    )

    const currentMonth = format(new Date(), "yyyy-MM")
    const snapshotPayload = useMemo(() => {
        if (!health.hasEnoughData) return null

        return {
            month: currentMonth,
            score: health.overallScore,
            status: health.status,
            netWorth: health.netWorth,
            savingsRatio: health.savingsRatio,
            debtToIncomeRatio: health.debtToIncomeRatio,
            emergencyFundRatio: health.emergencyFundRatio,
            expenseRatio: health.expenseRatio,
            funRatio: health.funRatio,
        }
    }, [
        currentMonth,
        health.hasEnoughData,
        health.overallScore,
        health.status,
        health.netWorth,
        health.savingsRatio,
        health.debtToIncomeRatio,
        health.emergencyFundRatio,
        health.expenseRatio,
        health.funRatio,
    ])

    const userId = user?.uid

    useEffect(() => {
        if (!userId || !snapshotPayload) return
        saveHealthSnapshot(snapshotPayload, userId)
    }, [userId, snapshotPayload, saveHealthSnapshot])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Excellent': return 'text-emerald-500'
            case 'Good': return 'text-blue-500'
            case 'Fair': return 'text-yellow-500'
            case 'Critical': return 'text-red-500'
            default: return 'text-gray-500'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Excellent': return <ShieldCheck className="h-6 w-6 text-emerald-500" />
            case 'Good': return <CheckCircle2 className="h-6 w-6 text-blue-500" />
            case 'Fair': return <AlertTriangle className="h-6 w-6 text-yellow-500" />
            case 'Critical': return <Activity className="h-6 w-6 text-red-500" />
            case 'Insufficient Data': return <Info className="h-6 w-6 text-gray-500" />
            default: return <Activity className="h-6 w-6 text-gray-500" />
        }
    }

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'Excellent': return 'bg-emerald-500'
            case 'Good': return 'bg-blue-500'
            case 'Fair': return 'bg-yellow-500'
            case 'Critical': return 'bg-red-500'
            default: return 'bg-gray-400'
        }
    }

    const formatPercent = (value: number) => health.hasEnoughData ? `${value.toFixed(1)}%` : "—"
    const formatMultiple = (value: number) => health.hasEnoughData ? `${value.toFixed(1)}x` : "—"

    return (
        <Card className="col-span-1 md:col-span-4 border shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5 text-primary" />
                    Financial Health
                </CardTitle>
                <CardDescription>Based on your last 3 months activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Score Header */}
                <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(health.status)}
                        <span className={`text-xl font-bold ${getStatusColor(health.status)}`}>
                            {health.status}
                        </span>
                    </div>

                    {health.hasEnoughData ? (
                        <div className="w-full space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0</span>
                                <span className="font-medium text-foreground">{health.overallScore} / 100</span>
                                <span>100</span>
                            </div>
                            <Progress
                                value={health.overallScore}
                                className="h-2"
                                indicatorColor={getStatusBg(health.status)}
                            />
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground text-center max-w-[230px]">
                            Record at least one income or expense transaction to calculate a score.
                        </p>
                    )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p
                            className="text-xs text-muted-foreground flex items-center gap-1"
                            title="Total assets (accounts, goals, receivables) minus active payables"
                        >
                            <TrendingUp className="h-3 w-3" /> Net Worth
                        </p>
                        <p className={`font-semibold text-sm ${health.netWorth < 0 ? 'text-red-500' : ''}`}>
                            {formatCurrency(health.netWorth, currency)}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p
                            className="text-xs text-muted-foreground"
                            title="(Income minus consumption expenses) divided by income over the last 3 months"
                        >
                            Savings Ratio
                        </p>
                        <p className={`font-semibold text-sm ${!health.hasEnoughData ? 'text-muted-foreground' : health.savingsRatio >= financialTargets.savingsRate ? 'text-emerald-500' : health.savingsRatio > 0 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {formatPercent(health.savingsRatio)} <span className="text-[10px] text-muted-foreground font-normal">(tgt: {financialTargets.savingsRate}%)</span>
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p
                            className="text-xs text-muted-foreground"
                            title="Consumption expenses divided by income over the last 3 months"
                        >
                            Expense Ratio
                        </p>
                        <p className={`font-semibold text-sm ${!health.hasEnoughData ? 'text-muted-foreground' : health.expenseRatio <= 80 ? 'text-emerald-500' : health.expenseRatio <= 100 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {formatPercent(health.expenseRatio)} <span className="text-[10px] text-muted-foreground font-normal">(max: 80%)</span>
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p
                            className="text-xs text-muted-foreground"
                            title="Discretionary expenses divided by income over the last 3 months"
                        >
                            Fun Ratio
                        </p>
                        <p className={`font-semibold text-sm ${!health.hasEnoughData ? 'text-muted-foreground' : health.funRatio <= 30 ? 'text-emerald-500' : health.funRatio <= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {formatPercent(health.funRatio)} <span className="text-[10px] text-muted-foreground font-normal">(max: 30%)</span>
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p
                            className="text-xs text-muted-foreground"
                            title="Minimum monthly debt payments divided by average monthly income"
                        >
                            Debt-to-Income
                        </p>
                        <p className={`font-semibold text-sm ${!health.hasEnoughData ? 'text-muted-foreground' : health.debtToIncomeRatio === 0 ? 'text-emerald-500' : health.debtToIncomeRatio < financialTargets.maxDti ? 'text-blue-500' : health.debtToIncomeRatio <= financialTargets.maxDti + 20 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {formatPercent(health.debtToIncomeRatio)} <span className="text-[10px] text-muted-foreground font-normal">(max: {financialTargets.maxDti}%)</span>
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p
                            className="text-xs text-muted-foreground"
                            title="Liquid or designated emergency-fund accounts divided by essential monthly expenses"
                        >
                            Emergency Fund
                        </p>
                        <p className={`font-semibold text-sm ${!health.hasEnoughData ? 'text-muted-foreground' : health.emergencyFundRatio >= financialTargets.emergencyFundMonths ? 'text-emerald-500' : health.emergencyFundRatio >= financialTargets.emergencyFundMonths / 2 ? 'text-blue-500' : health.emergencyFundRatio >= 1 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {formatMultiple(health.emergencyFundRatio)} <span className="text-[10px] text-muted-foreground font-normal">(target: {financialTargets.emergencyFundMonths}x)</span>
                        </p>
                    </div>
                </div>

                {/* Insights / Tips */}
                {health.tips.length > 0 && (
                    <div className="pt-4 border-t space-y-2">
                        <h4 className="text-sm font-medium">Insights</h4>
                        <ul className="space-y-2">
                            {health.tips.map((tip, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-md border border-border/50 flex items-start gap-2">
                                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
