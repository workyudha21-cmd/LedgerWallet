import { describe, expect, it } from 'vitest'
import { calculateBudgetingRule } from './budgeting'
import type { Category, Debt, Transaction } from './store'

let sequence = 0

const transaction = (
  type: Transaction['type'],
  amount: number,
  category: string
): Transaction => ({
  id: `transaction-${++sequence}`,
  userId: 'user-1',
  accountId: 'account-1',
  type,
  amount,
  category,
  date: new Date().toISOString(),
  description: 'Test transaction',
})

const debt = (overrides: Partial<Debt> = {}): Debt => ({
  id: `debt-${++sequence}`,
  userId: 'user-1',
  type: 'payable',
  personName: 'Bank',
  totalAmount: 12_000_000,
  remainingAmount: 12_000_000,
  status: 'active',
  createdAt: {} as never,
  ...overrides,
})

const category = (name: string, group: Category['group']): Category => ({
  id: `category-${++sequence}`,
  userId: 'user-1',
  name,
  type: 'expense',
  group,
})

describe('calculateBudgetingRule', () => {
  it('calculates the 50/30/20 split from the rolling window', () => {
    const result = calculateBudgetingRule(
      [
        transaction('income', 10_000_000, 'Salary'),
        transaction('expense', 3_000_000, 'Housing (Rent/Mortgage)'),
        transaction('expense', 2_000_000, 'Entertainment'),
      ],
      [],
      []
    )

    expect(result.monthlyIncome).toBeCloseTo(10_000_000 / 3)
    expect(result.needs).toBeCloseTo(1_000_000)
    expect(result.wants).toBeCloseTo(2_000_000 / 3)
    expect(result.needsRatio).toBeCloseTo(30)
    expect(result.wantsRatio).toBeCloseTo(20)
    expect(result.savingsRatio).toBeCloseTo(50)
  })

  it('includes minimum debt payments in needs', () => {
    const result = calculateBudgetingRule(
      [
        transaction('income', 10_000_000, 'Salary'),
        transaction('expense', 3_000_000, 'Housing (Rent/Mortgage)'),
        transaction('expense', 2_000_000, 'Entertainment'),
      ],
      [debt({ minimumPayment: 500_000 })],
      []
    )

    expect(result.needs).toBeCloseTo(1_500_000)
    expect(result.needsRatio).toBeCloseTo(45)
    expect(result.savingsRatio).toBeCloseTo(35)
  })

  it('respects custom category groups', () => {
    const result = calculateBudgetingRule(
      [
        transaction('income', 10_000_000, 'Salary'),
        transaction('expense', 1_000_000, 'Coffee'),
        transaction('expense', 2_000_000, 'Groceries'),
      ],
      [],
      [
        category('Coffee', 'discretionary'),
        category('Groceries', 'essential'),
      ]
    )

    expect(result.needs).toBeCloseTo(2_000_000 / 3)
    expect(result.wants).toBeCloseTo(1_000_000 / 3)
  })

  it('subtracts unclassified spending from savings', () => {
    const result = calculateBudgetingRule(
      [
        transaction('income', 10_000_000, 'Salary'),
        transaction('expense', 3_000_000, 'Housing (Rent/Mortgage)'),
        transaction('expense', 2_000_000, 'Misc'),
      ],
      [],
      []
    )

    expect(result.other).toBeCloseTo(2_000_000 / 3)
    expect(result.otherRatio).toBeCloseTo(20)
    expect(result.savingsRatio).toBeCloseTo(50)
  })

  it('returns insufficient data without income', () => {
    const result = calculateBudgetingRule(
      [transaction('expense', 1_000_000, 'Housing (Rent/Mortgage)')],
      [],
      []
    )

    expect(result.hasEnoughData).toBe(false)
    expect(result.savingsRatio).toBe(0)
  })
})
