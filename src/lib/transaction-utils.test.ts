import { describe, expect, it } from 'vitest'
import { getConsumptionAmount, isConsumptionExpense, isSavingsTransaction } from './transaction-utils'
import type { Transaction } from './store'

const transaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'transaction-1',
  userId: 'user-1',
  accountId: 'account-1',
  amount: 1_000_000,
  type: 'expense',
  category: 'Housing (Rent/Mortgage)',
  date: new Date().toISOString(),
  description: 'Test',
  ...overrides,
})

describe('transaction-utils', () => {
  it('treats savings transactions as non-consumption', () => {
    const savings = transaction({ type: 'savings', category: 'Asset Contribution' })

    expect(isSavingsTransaction(savings)).toBe(true)
    expect(isConsumptionExpense(savings)).toBe(false)
    expect(getConsumptionAmount(savings)).toBe(0)
  })

  it('treats goal contributions as non-consumption', () => {
    const goal = transaction({ type: 'expense', category: 'Goal Contribution', goalId: 'goal-1' })

    expect(isSavingsTransaction(goal)).toBe(true)
    expect(isConsumptionExpense(goal)).toBe(false)
    expect(getConsumptionAmount(goal)).toBe(0)
  })

  it('counts only interest from a split debt payment', () => {
    const payment = transaction({
      category: 'Debt Payment',
      debtId: 'debt-1',
      amount: 1_000_000,
      interestAmount: 100_000,
      principalAmount: 900_000,
    })

    expect(isConsumptionExpense(payment)).toBe(true)
    expect(getConsumptionAmount(payment)).toBe(100_000)
  })

  it('counts the full amount for expenses without a split', () => {
    const expense = transaction()

    expect(isConsumptionExpense(expense)).toBe(true)
    expect(getConsumptionAmount(expense)).toBe(1_000_000)
  })
})
