import { describe, expect, it } from 'vitest'
import { estimateDebtPayoff, splitDebtPayment } from './debt'
import type { Debt } from './store'

describe('splitDebtPayment', () => {
  it('treats the full payment as principal when there is no interest rate', () => {
    expect(splitDebtPayment(2_000_000, 12_000_000)).toEqual({
      interestAmount: 0,
      principalAmount: 2_000_000,
    })
  })

  it('splits monthly interest and principal', () => {
    const split = splitDebtPayment(2_000_000, 12_000_000, 12)

    expect(split.interestAmount).toBeCloseTo(120_000)
    expect(split.principalAmount).toBeCloseTo(1_880_000)
  })

  it('caps interest at the payment amount', () => {
    const split = splitDebtPayment(50_000, 12_000_000, 12)

    expect(split.interestAmount).toBeCloseTo(50_000)
    expect(split.principalAmount).toBe(0)
  })

  it('returns no interest when the remaining balance is zero', () => {
    expect(splitDebtPayment(1_000_000, 0, 18)).toEqual({
      interestAmount: 0,
      principalAmount: 1_000_000,
    })
  })
})

let debtSequence = 0

const debt = (overrides: Partial<Debt> = {}): Debt => ({
  id: `debt-${++debtSequence}`,
  userId: 'user-1',
  type: 'payable',
  personName: 'Bank',
  totalAmount: 12_000_000,
  remainingAmount: 12_000_000,
  status: 'active',
  createdAt: {} as never,
  ...overrides,
})

describe('estimateDebtPayoff', () => {
  it('projects a debt-free date for an interest-free debt', () => {
    const now = new Date(2026, 0, 15)
    const result = estimateDebtPayoff(
      [debt({ remainingAmount: 12_000_000, minimumPayment: 1_000_000 })],
      now
    )

    expect(result.months).toBe(12)
    expect(result.debtFreeDate?.getFullYear()).toBe(2027)
    expect(result.totalMinimumPayment).toBe(1_000_000)
  })

  it('projects an amortized payoff with interest', () => {
    const result = estimateDebtPayoff([
      debt({ remainingAmount: 12_000_000, minimumPayment: 2_000_000, interestRate: 12 }),
    ])

    expect(result.months).toBe(7)
    expect(result.weightedInterestRate).toBeCloseTo(12)
  })

  it('flags payments that do not cover interest', () => {
    const result = estimateDebtPayoff([
      debt({ remainingAmount: 12_000_000, minimumPayment: 100_000, interestRate: 12 }),
    ])

    expect(result.hasUnpayableDebt).toBe(true)
    expect(result.months).toBeNull()
  })

  it('flags missing minimum payments', () => {
    const result = estimateDebtPayoff([
      debt({ remainingAmount: 12_000_000 }),
    ])

    expect(result.hasMissingPayment).toBe(true)
    expect(result.months).toBeNull()
  })

  it('ignores paid debts and receivables', () => {
    const result = estimateDebtPayoff([
      debt({ remainingAmount: 0, minimumPayment: 1_000_000 }),
      debt({ type: 'receivable', remainingAmount: 5_000_000, minimumPayment: 1_000_000 }),
    ])

    expect(result.totalDebt).toBe(0)
    expect(result.months).toBeNull()
  })
})
