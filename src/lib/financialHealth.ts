import type { Account, Category, Transaction, Debt, FinancialGoal } from './store'
import { subDays, isAfter } from 'date-fns'
import { isLiquidAccountType } from './constants'
import { buildCategoryGroupMap, getCategoryGroupFromMap } from './category-groups'
import { calculateNetWorth } from './netWorth'
import {
    DEFAULT_FINANCIAL_TARGETS,
    type FinancialTargets
} from './financialTargets'
import { getConsumptionAmount, isConsumptionExpense } from './transaction-utils'

export interface FinancialHealthScore {
    netWorth: number
    savingsRatio: number
    debtToIncomeRatio: number
    emergencyFundRatio: number
    expenseRatio: number
    funRatio: number
    overallScore: number
    status: 'Insufficient Data' | 'Critical' | 'Fair' | 'Good' | 'Excellent'
    tips: string[]
    hasEnoughData: boolean
}

const MONTHS_IN_WINDOW = 3

export function calculateFinancialHealth(
    accounts: Account[],
    transactions: Transaction[],
    debts: Debt[],
    goals: FinancialGoal[],
    categories: Category[] = [],
    targets: FinancialTargets = DEFAULT_FINANCIAL_TARGETS
): FinancialHealthScore {
    const now = new Date()
    const windowStart = subDays(now, 90)

    // 1. Net worth is a current snapshot of assets and liabilities.
    const activeDebts = debts.filter(d => d.status !== 'paid' && d.remainingAmount > 0)
    const { netWorth, totalPayables } = calculateNetWorth(accounts, goals, debts)

    // 2. Ratios use a rolling 3-month window to smooth irregular income and expenses.
    const recentTransactions = transactions.filter(t => isAfter(new Date(t.date), windowStart))
    const consumptionExpenses = recentTransactions.filter(isConsumptionExpense)

    const income90Days = recentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

    const expense90Days = recentTransactions
        .reduce((sum, t) => sum + getConsumptionAmount(t), 0)

    const monthlyIncome = income90Days / MONTHS_IN_WINDOW

    const hasIncomeData = recentTransactions.some(t => t.type === 'income')
    const hasExpenseData = expense90Days > 0
    const hasEnoughData = hasIncomeData && hasExpenseData

    // 3. Savings Ratio: (income - consumption expenses) / income.
    const savingsRatio = income90Days > 0
        ? ((income90Days - expense90Days) / income90Days) * 100
        : 0

    // 4. DTI uses contractual minimum payments when available.
    const minimumDebtPayments = activeDebts
        .filter(d => d.type === 'payable')
        .reduce((sum, d) => sum + (d.minimumPayment || 0), 0)

    const actualDebtPayments90Days = recentTransactions
        .filter(t => isConsumptionExpense(t) && (t.debtId || t.category.toLowerCase().includes('debt')))
        .reduce((sum, t) => sum + t.amount, 0)

    const monthlyDebtPayments = minimumDebtPayments > 0
        ? minimumDebtPayments
        : actualDebtPayments90Days / MONTHS_IN_WINDOW

    const debtToIncomeRatio = monthlyIncome > 0
        ? (monthlyDebtPayments / monthlyIncome) * 100
        : (totalPayables > 0 ? 100 : 0)

    // 5. Emergency fund uses designated or liquid accounts and essential expenses.
    const emergencyAccounts = accounts.filter(a => a.isEmergencyFund)
    const liquidAccounts = emergencyAccounts.length > 0
        ? emergencyAccounts
        : accounts.filter(a => a.isLiquid ?? isLiquidAccountType(a.type))

    const liquidAssets = liquidAccounts.reduce((sum, account) => sum + (account.balance || 0), 0)

    const categoryGroups = buildCategoryGroupMap(categories)
    const groupFor = (category: string) =>
        getCategoryGroupFromMap(category, categoryGroups)

    const essentialExpenses90Days = consumptionExpenses
        .filter(t => groupFor(t.category) === 'essential')
        .reduce((sum, t) => sum + getConsumptionAmount(t), 0)

    const discretionaryExpenses90Days = consumptionExpenses
        .filter(t => groupFor(t.category) === 'discretionary')
        .reduce((sum, t) => sum + getConsumptionAmount(t), 0)

    const essentialExpenseBase = essentialExpenses90Days > 0
        ? essentialExpenses90Days
        : expense90Days
    const monthlyEssentialExpenses = essentialExpenseBase / MONTHS_IN_WINDOW
    const monthlyEssentialWithDebt = monthlyEssentialExpenses + monthlyDebtPayments
    const emergencyFundRatio = monthlyEssentialWithDebt > 0
        ? liquidAssets / monthlyEssentialWithDebt
        : 0

    // 6. Expense and discretionary ("fun") ratios.
    const expenseRatio = income90Days > 0
        ? (expense90Days / income90Days) * 100
        : 0

    const funRatio = income90Days > 0
        ? (discretionaryExpenses90Days / income90Days) * 100
        : 0

    if (!hasEnoughData) {
        const tips: string[] = []

        if (!hasIncomeData) {
            tips.push("Add income transactions to calculate savings and DTI.")
        }
        if (!hasExpenseData) {
            tips.push("Add expense transactions to calculate spending and emergency-fund coverage.")
        }

        return {
            netWorth,
            savingsRatio: 0,
            debtToIncomeRatio: 0,
            emergencyFundRatio: 0,
            expenseRatio: 0,
            funRatio: 0,
            overallScore: 0,
            status: 'Insufficient Data',
            tips,
            hasEnoughData: false
        }
    }

    // 7. Scoring (0 - 100)
    const savingsTarget = Math.max(1, targets.savingsRate)
    const maxDti = Math.max(1, targets.maxDti)
    const emergencyTarget = Math.max(1, targets.emergencyFundMonths)

    let score = 0
    const tips: string[] = []

    // Net Worth (Max 20 points)
    if (netWorth > 0) score += 20
    else if (netWorth === 0) score += 10
    else tips.push("Your net worth is negative. Focus on paying down debts to build wealth.")

    // Savings Ratio (Max 30 points)
    if (savingsRatio >= savingsTarget) {
        score += 30
    } else if (savingsRatio > 0) {
        score += 15
        tips.push(`Try to save at least ${savingsTarget}% of your income to improve your savings ratio.`)
    } else {
        tips.push("Your expenses exceed your income. Review your budget to cut unnecessary costs.")
    }

    // Debt to Income (Max 25 points)
    if (debtToIncomeRatio === 0) {
        score += 25
    } else if (debtToIncomeRatio < maxDti) {
        score += 20
    } else if (debtToIncomeRatio <= maxDti + 20) {
        score += 10
        tips.push("Your debt payments are taking up a large portion of your income. Consider a debt payoff strategy.")
    } else {
        tips.push("Critical DTI. Focus aggressively on reducing debt obligations.")
    }

    // Emergency Fund (Max 25 points)
    if (emergencyFundRatio >= emergencyTarget) {
        score += 25
    } else if (emergencyFundRatio >= emergencyTarget / 2) {
        score += 20
    } else if (emergencyFundRatio >= 1) {
        score += 10
        tips.push(`Your emergency fund covers less than ${emergencyTarget} months of essential expenses. Try to build it up.`)
    } else {
        tips.push("You are highly vulnerable to financial shocks. Start saving an emergency fund immediately.")
    }

    if (funRatio > 30) {
        tips.push("Your discretionary spending is above 30% of income. Review non-essential expenses.")
    }

    score = Math.max(0, Math.min(100, score))

    let status: FinancialHealthScore['status'] = 'Critical'
    if (score >= 80) status = 'Excellent'
    else if (score >= 60) status = 'Good'
    else if (score >= 40) status = 'Fair'

    if (tips.length === 0 && status === 'Excellent') {
        tips.push("Great job! Your finances are in exceptional shape. Keep up the good work.")
    }

    return {
        netWorth,
        savingsRatio,
        debtToIncomeRatio,
        emergencyFundRatio,
        expenseRatio,
        funRatio,
        overallScore: score,
        status,
        tips,
        hasEnoughData: true
    }
}
