import { describe, expect, it } from 'vitest'
import { buildAmortizationSchedule, estimateDebtPayoff, estimatePayoffAmount, splitDebtPayment } from './debt'
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

  it('caps principal at the remaining balance on payoff', () => {
    const split = splitDebtPayment(12_120_000, 12_000_000, 12)

    expect(split.interestAmount).toBeCloseTo(120_000)
    expect(split.principalAmount).toBeCloseTo(12_000_000)
  })

  it('leaves the monthly interest unpaid when paying only the principal balance', () => {
    const split = splitDebtPayment(12_000_000, 12_000_000, 12)

    expect(split.interestAmount).toBeCloseTo(120_000)
    expect(split.principalAmount).toBeCloseTo(11_880_000)
  })

  it('caps principal and treats the excess as interest on overpayment', () => {
    const split = splitDebtPayment(13_000_000, 12_000_000, 12)

    expect(split.interestAmount).toBeCloseTo(1_000_000)
    expect(split.principalAmount).toBeCloseTo(12_000_000)
  })

  it('caps principal for an interest-free overpayment', () => {
    const split = splitDebtPayment(13_000_000, 12_000_000)

    expect(split.interestAmount).toBeCloseTo(1_000_000)
    expect(split.principalAmount).toBeCloseTo(12_000_000)
  })
})

describe('estimatePayoffAmount', () => {
  it('adds one month of interest to the remaining principal', () => {
    expect(estimatePayoffAmount(12_000_000, 12)).toBe(12_120_000)
  })

  it('returns the remaining principal when there is no interest', () => {
    expect(estimatePayoffAmount(12_000_000)).toBe(12_000_000)
    expect(estimatePayoffAmount(12_000_000, 0)).toBe(12_000_000)
    expect(estimatePayoffAmount(0, 18)).toBe(0)
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

describe('buildAmortizationSchedule', () => {
  it('builds a schedule for an interest-free debt', () => {
    const schedule = buildAmortizationSchedule(12_000_000, 0, 1_000_000)

    expect(schedule).toHaveLength(12)
    expect(schedule[0].interest).toBe(0)
    expect(schedule[0].principal).toBe(1_000_000)
    expect(schedule[schedule.length - 1].balance).toBe(0)
  })

  it('builds a schedule with monthly interest', () => {
    const schedule = buildAmortizationSchedule(12_000_000, 12, 2_000_000)

    expect(schedule).toHaveLength(7)
    expect(schedule[0].interest).toBeCloseTo(120_000)
    expect(schedule[0].principal).toBeCloseTo(1_880_000)
    expect(schedule[schedule.length - 1].balance).toBe(0)
  })

  it('returns an empty schedule when payment does not cover interest', () => {
    expect(buildAmortizationSchedule(12_000_000, 12, 100_000)).toHaveLength(0)
  })

  it('returns an empty schedule for zero balance or payment', () => {
    expect(buildAmortizationSchedule(0, 12, 1_000_000)).toHaveLength(0)
    expect(buildAmortizationSchedule(1_000_000, 12, 0)).toHaveLength(0)
  })
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
