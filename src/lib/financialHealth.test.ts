import { describe, expect, it } from 'vitest'
import { calculateFinancialHealth } from './financialHealth'
import type { Account, Transaction } from './store'

const account = (balance: number): Account => ({
  id: 'account-1',
  userId: 'user-1',
  name: 'Cash',
  type: 'Cash',
  balance,
})

const transaction = (
  type: 'income' | 'expense',
  amount: number,
  category: string
): Transaction => ({
  id: `${type}-${amount}-${category}`,
  userId: 'user-1',
  accountId: 'account-1',
  type,
  amount,
  category,
  date: new Date().toISOString(),
  description: 'Test transaction',
})

describe('calculateFinancialHealth', () => {
  it('returns a critical score for an empty profile', () => {
    const health = calculateFinancialHealth([], [], [], [])

    expect(health.netWorth).toBe(0)
    expect(health.savingsRatio).toBe(0)
    expect(health.debtToIncomeRatio).toBe(0)
    expect(health.overallScore).toBe(35)
    expect(health.status).toBe('Critical')
    expect(health.tips.length).toBeGreaterThan(0)
  })

  it('scores a healthy profile as excellent', () => {
    const health = calculateFinancialHealth(
      [account(10_000_000)],
      [
        transaction('income', 5_000_000, 'Salary'),
        transaction('expense', 3_000_000, 'Housing (Rent/Mortgage)'),
      ],
      [],
      []
    )

    expect(health.netWorth).toBe(10_000_000)
    expect(health.savingsRatio).toBeCloseTo(40)
    expect(health.debtToIncomeRatio).toBe(0)
    expect(health.emergencyFundRatio).toBeCloseTo(10 / 3)
    expect(health.overallScore).toBe(95)
    expect(health.status).toBe('Excellent')
  })

  it('flags overspending', () => {
    const health = calculateFinancialHealth(
      [account(1_000_000)],
      [
        transaction('income', 2_000_000, 'Salary'),
        transaction('expense', 3_000_000, 'Food & Dining'),
      ],
      [],
      []
    )

    expect(health.savingsRatio).toBeCloseTo(-50)
    expect(health.overallScore).toBe(45)
    expect(health.status).toBe('Fair')
    expect(health.tips.some((tip) => tip.includes('expenses exceed'))).toBe(true)
  })
})
