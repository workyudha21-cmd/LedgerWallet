import type { Transaction } from './store'

const LEGACY_GOAL_CATEGORIES = new Set([
  'Navigasi / Financial Goal',
  'Goal Contribution',
])

export function isSavingsTransaction(
  transaction: Pick<Transaction, 'type' | 'goalId' | 'category'>
) {
  return (
    transaction.type === 'savings' ||
    Boolean(transaction.goalId) ||
    LEGACY_GOAL_CATEGORIES.has(transaction.category)
  )
}

export function isConsumptionExpense(
  transaction: Pick<Transaction, 'type' | 'goalId' | 'category'>
) {
  return transaction.type === 'expense' && !isSavingsTransaction(transaction)
}

export function getConsumptionAmount(
  transaction: Pick<
    Transaction,
    'type' | 'goalId' | 'category' | 'amount' | 'debtId' | 'interestAmount'
  >
) {
  if (!isConsumptionExpense(transaction)) return 0

  if (transaction.debtId && typeof transaction.interestAmount === 'number') {
    return transaction.interestAmount
  }

  return transaction.amount
}
