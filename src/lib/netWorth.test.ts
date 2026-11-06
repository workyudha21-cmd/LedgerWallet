import { describe, expect, it } from 'vitest'
import { calculateNetWorth } from './netWorth'
import type { Account, Debt, FinancialGoal } from './store'

let sequence = 0

const account = (balance: number, overrides: Partial<Account> = {}): Account => ({
  id: `account-${++sequence}`,
  userId: 'user-1',
  name: 'Cash',
  type: 'Cash',
  balance,
  ...overrides,
})

const goal = (currentAmount: number): FinancialGoal => ({
  id: `goal-${++sequence}`,
  userId: 'user-1',
  name: 'Goal',
  targetAmount: currentAmount,
  currentAmount,
})

const debt = (overrides: Partial<Debt> = {}): Debt => ({
  id: `debt-${++sequence}`,
  userId: 'user-1',
  type: 'payable',
  personName: 'Bank',
  totalAmount: 1_000_000,
  remainingAmount: 1_000_000,
  status: 'active',
  createdAt: {} as never,
  ...overrides,
})

describe('calculateNetWorth', () => {
  it('combines included accounts, goals, receivables, and payables', () => {
    const result = calculateNetWorth(
      [
        account(10_000_000),
        account(5_000_000, { includeInNetWorth: false }),
      ],
      [goal(2_000_000)],
      [
        debt({ type: 'receivable', totalAmount: 1_000_000, remainingAmount: 1_000_000 }),
        debt({ type: 'payable', totalAmount: 3_000_000, remainingAmount: 3_000_000 }),
      ]
    )

    expect(result.totalAccounts).toBe(10_000_000)
    expect(result.totalGoals).toBe(2_000_000)
    expect(result.totalReceivables).toBe(1_000_000)
    expect(result.totalAssets).toBe(13_000_000)
    expect(result.totalPayables).toBe(3_000_000)
    expect(result.netWorth).toBe(10_000_000)
  })

  it('ignores paid debts', () => {
    const result = calculateNetWorth(
      [account(5_000_000)],
      [],
      [
        debt({ remainingAmount: 2_000_000, status: 'paid' }),
        debt({ remainingAmount: 0, status: 'active' }),
      ]
    )

    expect(result.totalPayables).toBe(0)
    expect(result.netWorth).toBe(5_000_000)
  })
})
