import type { Account, Transaction, Debt, FinancialGoal } from './store'
import { subDays, isAfter } from 'date-fns'

export interface FinancialHealthScore {
    netWorth: number
    savingsRatio: number
    debtToIncomeRatio: number
    emergencyFundRatio: number
    overallScore: number
    status: 'Critical' | 'Fair' | 'Good' | 'Excellent'
    tips: string[]
}

export function calculateFinancialHealth(
    accounts: Account[],
    transactions: Transaction[],
    debts: Debt[],
    goals: FinancialGoal[]
): FinancialHealthScore {
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)

    // 1. Calculate Net Worth
    // Aset: Saldo akun + uang di goals + piutang (uang orang di kita = receivables)
    // Hutang: payables
    const totalAccountBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalGoalSavings = goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0)

    const totalReceivables = debts
        .filter(d => d.type === 'receivable' && d.status === 'active')
        .reduce((sum, d) => sum + (d.remainingAmount || 0), 0)

    const totalPayables = debts
        .filter(d => d.type === 'payable' && d.status === 'active')
        .reduce((sum, d) => sum + (d.remainingAmount || 0), 0)

    const totalAssets = totalAccountBalance + totalGoalSavings + totalReceivables
    const netWorth = totalAssets - totalPayables

    // 2. Calculate 30-Day Income & Expense
    const last30DaysTransactions = transactions.filter(t => isAfter(new Date(t.date), thirtyDaysAgo))

    const income30Days = last30DaysTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

    const expense30Days = last30DaysTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

    // 3. Savings Ratio: (Income - Expense) / Income -> ideally > 20%
    const savingsRatio = income30Days > 0
        ? ((income30Days - expense30Days) / income30Days) * 100
        : 0 // If no income or negative, it's 0% or negative

    // 4. Debt-to-Income (DTI) Ratio: Debt payments / Income -> ideally < 30%
    // We approximate debt payments by finding 'Debt Payment' categorized expenses
    const debtPayments30Days = last30DaysTransactions
        .filter(t => t.type === 'expense' && t.category.toLowerCase().includes('debt'))
        .reduce((sum, t) => sum + t.amount, 0)

    const debtToIncomeRatio = income30Days > 0
        ? (debtPayments30Days / income30Days) * 100
        : (totalPayables > 0 ? 100 : 0) // if no income but have debt, it's bad

    // 5. Emergency Fund Ratio: Liquidity / Monthly Expenses -> ideally > 3 months
    // Liquid assets = account balances (might exclude some, but we use total for now)
    const monthlyExpenses = expense30Days > 0 ? expense30Days : 1 // prevent div zero
    const emergencyFundRatio = totalAccountBalance / monthlyExpenses

    // 6. Scoring Logic (0 - 100)
    let score = 0
    const tips: string[] = []

    // Net Worth (Max 20 points)
    if (netWorth > 0) score += 20
    else if (netWorth === 0) score += 10
    else tips.push("Your net worth is negative. Focus on paying down debts to build wealth.")

    // Savings Ratio (Max 30 points)
    if (savingsRatio >= 20) {
        score += 30
    } else if (savingsRatio > 0 && savingsRatio < 20) {
        score += 15
        tips.push("Try to save at least 20% of your income to improve your savings ratio.")
    } else {
        tips.push("Your expenses exceed your income. Review your budget to cut unnecessary costs.")
    }

    // Debt to Income (Max 25 points)
    if (debtToIncomeRatio === 0) {
        score += 25
    } else if (debtToIncomeRatio < 30) {
        score += 20
    } else if (debtToIncomeRatio <= 50) {
        score += 10
        tips.push("Your debt payments are taking up a large portion of your income. Consider a debt payoff strategy.")
    } else {
        tips.push("Critical DTI. Focus aggressively on reducing debt obligations.")
    }

    // Emergency Fund (Max 25 points)
    if (emergencyFundRatio >= 6) {
        score += 25
    } else if (emergencyFundRatio >= 3) {
        score += 20
    } else if (emergencyFundRatio >= 1) {
        score += 10
        tips.push("Your emergency fund covers less than 3 months of expenses. Try to build it up.")
    } else {
        tips.push("You are highly vulnerable to financial shocks. Start saving an emergency fund immediately.")
    }

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score))

    // Determine Status
    let status: 'Critical' | 'Fair' | 'Good' | 'Excellent' = 'Critical'
    if (score >= 80) status = 'Excellent'
    else if (score >= 60) status = 'Good'
    else if (score >= 40) status = 'Fair'

    // Give praise if doing great
    if (tips.length === 0 && status === 'Excellent') {
        tips.push("Great job! Your finances are in exceptional shape. Keep up the good work.")
    }

    return {
        netWorth,
        savingsRatio,
        debtToIncomeRatio,
        emergencyFundRatio,
        overallScore: score,
        status,
        tips
    }
}
