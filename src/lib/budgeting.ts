import { isAfter, subDays } from 'date-fns'
import type { Category, Debt, Transaction } from './store'
import { buildCategoryGroupMap, getCategoryGroupFromMap } from './category-groups'
import { getConsumptionAmount, isConsumptionExpense } from './transaction-utils'

export interface BudgetingRuleBreakdown {
  hasEnoughData: boolean
  monthlyIncome: number
  needs: number
  wants: number
  other: number
  savings: number
  needsRatio: number
  wantsRatio: number
  otherRatio: number
  savingsRatio: number
}

const MONTHS_IN_WINDOW = 3

export function calculateBudgetingRule(
  transactions: Transaction[],
  debts: Debt[],
  categories: Category[] = []
): BudgetingRuleBreakdown {
  const windowStart = subDays(new Date(), MONTHS_IN_WINDOW * 30)
  const recentTransactions = transactions.filter(
    transaction => isAfter(new Date(transaction.date), windowStart)
  )

  const income = recentTransactions
    .filter(transaction => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const categoryGroups = buildCategoryGroupMap(categories)

  const essentialExpenses = recentTransactions
    .filter(transaction =>
      isConsumptionExpense(transaction) &&
      getCategoryGroupFromMap(transaction.category, categoryGroups) === 'essential'
    )
    .reduce((sum, transaction) => sum + getConsumptionAmount(transaction), 0)

  const discretionaryExpenses = recentTransactions
    .filter(transaction =>
      isConsumptionExpense(transaction) &&
      getCategoryGroupFromMap(transaction.category, categoryGroups) === 'discretionary'
    )
    .reduce((sum, transaction) => sum + getConsumptionAmount(transaction), 0)

  const unclassifiedExpenses = recentTransactions
    .filter(transaction => isConsumptionExpense(transaction) && !transaction.debtId)
    .filter(transaction => {
      const group = getCategoryGroupFromMap(transaction.category, categoryGroups)
      return group !== 'essential' && group !== 'discretionary'
    })
    .reduce((sum, transaction) => sum + getConsumptionAmount(transaction), 0)

  const activePayables = debts.filter(
    debt => debt.type === 'payable' && debt.status !== 'paid' && debt.remainingAmount > 0
  )

  const minimumPayments = activePayables.reduce(
    (sum, debt) => sum + (debt.minimumPayment || 0),
    0
  )

  const actualDebtPayments = recentTransactions
    .filter(transaction =>
      isConsumptionExpense(transaction) &&
      (transaction.debtId || transaction.category.toLowerCase().includes('debt'))
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const monthlyDebtPayments = minimumPayments > 0
    ? minimumPayments
    : actualDebtPayments / MONTHS_IN_WINDOW

  const monthlyIncome = income / MONTHS_IN_WINDOW
  const needs = essentialExpenses / MONTHS_IN_WINDOW + monthlyDebtPayments
  const wants = discretionaryExpenses / MONTHS_IN_WINDOW
  const other = unclassifiedExpenses / MONTHS_IN_WINDOW
  const savings = monthlyIncome - needs - wants - other

  const hasEnoughData = monthlyIncome > 0 && (needs > 0 || wants > 0 || other > 0)

  return {
    hasEnoughData,
    monthlyIncome,
    needs,
    wants,
    other,
    savings,
    needsRatio: monthlyIncome > 0 ? (needs / monthlyIncome) * 100 : 0,
    wantsRatio: monthlyIncome > 0 ? (wants / monthlyIncome) * 100 : 0,
    otherRatio: monthlyIncome > 0 ? (other / monthlyIncome) * 100 : 0,
    savingsRatio: monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0,
  }
}
