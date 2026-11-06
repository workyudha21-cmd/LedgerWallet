import { describe, expect, it } from 'vitest'
import { calculateFinancialHealth } from './financialHealth'
import type { Account, Category, Debt, FinancialGoal, Transaction } from './store'

let sequence = 0

const account = (balance: number, overrides: Partial<Account> = {}): Account => ({
  id: `account-${++sequence}`,
  userId: 'user-1',
  name: 'Cash',
  type: 'Cash',
  balance,
  ...overrides,
})

const transaction = (
  type: Transaction['type'],
  amount: number,
  category: string,
  overrides: Partial<Transaction> = {}
): Transaction => ({
  id: `transaction-${++sequence}`,
  userId: 'user-1',
  accountId: 'account-1',
  type,
  amount,
  category,
  date: new Date().toISOString(),
  description: 'Test transaction',
  ...overrides,
})

const debt = (overrides: Partial<Debt> = {}): Debt => ({
  id: `debt-${++sequence}`,
  userId: 'user-1',
  type: 'payable',
  personName: 'Bank',
  totalAmount: 5_000_000,
  remainingAmount: 5_000_000,
  status: 'active',
  createdAt: {} as never,
  ...overrides,
})

const expenseCategory = (
  name: string,
  group: Category['group'],
  overrides: Partial<Category> = {}
): Category => ({
  id: `category-${++sequence}`,
  userId: 'user-1',
  name,
  type: 'expense',
  group,
  ...overrides,
})

const goal = (currentAmount: number, overrides: Partial<FinancialGoal> = {}): FinancialGoal => ({
  id: `goal-${++sequence}`,
  userId: 'user-1',
  name: 'Emergency fund',
  targetAmount: 10_000_000,
  currentAmount,
  ...overrides,
})

describe('calculateFinancialHealth', () => {
  it('returns insufficient data for an empty profile', () => {
    const health = calculateFinancialHealth([], [], [], [])

    expect(health.hasEnoughData).toBe(false)
    expect(health.status).toBe('Insufficient Data')
    expect(health.overallScore).toBe(0)
    expect(health.netWorth).toBe(0)
    expect(health.tips.length).toBeGreaterThan(0)
  })

  it('requires both income and expense data', () => {
    const health = calculateFinancialHealth(
      [account(5_000_000)],
      [transaction('income', 5_000_000, 'Salary')],
      [],
      []
    )

    expect(health.hasEnoughData).toBe(false)
    expect(health.status).toBe('Insufficient Data')
  })

  it('still reports net worth when there are assets but no transactions', () => {
    const health = calculateFinancialHealth([account(5_000_000)], [], [], [])

    expect(health.hasEnoughData).toBe(false)
    expect(health.netWorth).toBe(5_000_000)
    expect(health.status).toBe('Insufficient Data')
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

    expect(health.hasEnoughData).toBe(true)
    expect(health.netWorth).toBe(10_000_000)
    expect(health.savingsRatio).toBeCloseTo(40)
    expect(health.debtToIncomeRatio).toBe(0)
    expect(health.emergencyFundRatio).toBeCloseTo(10)
    expect(health.expenseRatio).toBeCloseTo(60)
    expect(health.funRatio).toBe(0)
    expect(health.overallScore).toBe(100)
    expect(health.status).toBe('Excellent')
  })

  it('flags overspending and a thin emergency fund', () => {
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
    expect(health.expenseRatio).toBeCloseTo(150)
    expect(health.emergencyFundRatio).toBeCloseTo(1)
    expect(health.overallScore).toBe(55)
    expect(health.status).toBe('Fair')
    expect(health.tips.some((tip) => tip.includes('expenses exceed'))).toBe(true)
  })

  it('excludes goal contributions from expenses', () => {
    const health = calculateFinancialHealth(
      [account(10_000_000)],
      [
        transaction('income', 10_000_000, 'Salary'),
        transaction('expense', 6_000_000, 'Housing (Rent/Mortgage)'),
        transaction('savings', 2_000_000, 'Goal Contribution', { goalId: 'goal-1' }),
        transaction('expense', 1_000_000, 'Navigasi / Financial Goal'),
      ],
      [],
      [goal(3_000_000)]
    )

    expect(health.savingsRatio).toBeCloseTo(40)
    expect(health.expenseRatio).toBeCloseTo(60)
    expect(health.funRatio).toBe(0)
    expect(health.overallScore).toBe(95)
  })

  it('uses only liquid or designated accounts for the emergency fund', () => {
    const health = calculateFinancialHealth(
      [
        account(6_000_000, { type: 'Cash' }),
        account(20_000_000, { type: 'Investment' }),
      ],
      [
        transaction('income', 12_000_000, 'Salary'),
        transaction('expense', 6_000_000, 'Utilities'),
      ],
      [],
      []
    )

    expect(health.emergencyFundRatio).toBeCloseTo(3)
  })

  it('prefers accounts explicitly marked as emergency funds', () => {
    const health = calculateFinancialHealth(
      [
        account(6_000_000, { type: 'Investment', isEmergencyFund: true }),
        account(10_000_000, { type: 'Bank' }),
      ],
      [
        transaction('income', 12_000_000, 'Salary'),
        transaction('expense', 6_000_000, 'Utilities'),
      ],
      [],
      []
    )

    expect(health.emergencyFundRatio).toBeCloseTo(3)
  })

  it('uses minimum debt payments for DTI', () => {
    const health = calculateFinancialHealth(
      [account(10_000_000)],
      [
        transaction('income', 15_000_000, 'Salary'),
        transaction('expense', 3_000_000, 'Utilities'),
      ],
      [debt({ totalAmount: 5_000_000, remainingAmount: 5_000_000, minimumPayment: 1_000_000 })],
      []
    )

    expect(health.debtToIncomeRatio).toBeCloseTo(20)
    expect(health.netWorth).toBe(5_000_000)
    expect(health.overallScore).toBe(90)
    expect(health.status).toBe('Excellent')
  })

  it('reports the discretionary fun ratio', () => {
    const health = calculateFinancialHealth(
      [account(10_000_000)],
      [
        transaction('income', 10_000_000, 'Salary'),
        transaction('expense', 3_000_000, 'Housing (Rent/Mortgage)'),
        transaction('expense', 4_000_000, 'Entertainment'),
      ],
      [],
      []
    )

    expect(health.expenseRatio).toBeCloseTo(70)
    expect(health.funRatio).toBeCloseTo(40)
    expect(health.savingsRatio).toBeCloseTo(30)
    expect(health.tips.some((tip) => tip.includes('discretionary'))).toBe(true)
  })

  it('uses configured category groups', () => {
    const health = calculateFinancialHealth(
      [account(10_000_000)],
      [
        transaction('income', 10_000_000, 'Salary'),
        transaction('expense', 2_000_000, 'Coffee'),
      ],
      [],
      [],
      [expenseCategory('Coffee', 'discretionary')]
    )

    expect(health.expenseRatio).toBeCloseTo(20)
    expect(health.funRatio).toBeCloseTo(20)
  })

  it('excludes accounts flagged out of net worth', () => {
    const health = calculateFinancialHealth(
      [
        account(5_000_000),
        account(10_000_000, { includeInNetWorth: false }),
      ],
      [
        transaction('income', 5_000_000, 'Salary'),
        transaction('expense', 1_000_000, 'Utilities'),
      ],
      [],
      []
    )

    expect(health.netWorth).toBe(5_000_000)
  })

  it('counts only interest from split debt payments as consumption', () => {
    const health = calculateFinancialHealth(
      [account(10_000_000)],
      [
        transaction('income', 10_000_000, 'Salary'),
        transaction('expense', 3_000_000, 'Housing (Rent/Mortgage)'),
        transaction('expense', 1_000_000, 'Debt Payment', {
          debtId: 'debt-split',
          interestAmount: 100_000,
          principalAmount: 900_000,
        }),
      ],
      [debt({ totalAmount: 6_000_000, remainingAmount: 5_000_000, minimumPayment: 1_000_000 })],
      []
    )

    expect(health.expenseRatio).toBeCloseTo(31)
    expect(health.savingsRatio).toBeCloseTo(69)
  })

  it('uses user-configured financial targets', () => {
    const health = calculateFinancialHealth(
      [account(10_000_000)],
      [
        transaction('income', 15_000_000, 'Salary'),
        transaction('expense', 3_000_000, 'Utilities'),
      ],
      [debt({ totalAmount: 5_000_000, remainingAmount: 5_000_000, minimumPayment: 1_000_000 })],
      [],
      [],
      { emergencyFundMonths: 3, savingsRate: 50, maxDti: 20 }
    )

    expect(health.overallScore).toBe(85)
  })
})
