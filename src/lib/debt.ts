import { addMonths } from 'date-fns'
import type { Debt } from './store'

export interface DebtPaymentSplit {
  interestAmount: number
  principalAmount: number
}

export interface AmortizationRow {
  month: number
  payment: number
  interest: number
  principal: number
  balance: number
}

export interface DebtPayoffProjection {
  totalDebt: number
  totalMinimumPayment: number
  weightedInterestRate: number
  months: number | null
  debtFreeDate: Date | null
  hasMissingPayment: boolean
  hasUnpayableDebt: boolean
}

export function estimatePayoffAmount(
  remainingAmount: number,
  annualInterestRate?: number
): number {
  const remaining = Math.max(0, remainingAmount)
  const rate = annualInterestRate && annualInterestRate > 0 ? annualInterestRate : 0

  if (remaining === 0 || rate === 0) return remaining

  return Math.ceil(remaining * (1 + rate / 100 / 12))
}

export function splitDebtPayment(
  amount: number,
  remainingAmount: number,
  annualInterestRate?: number
): DebtPaymentSplit {
  const payment = Math.max(0, amount)
  const remaining = Math.max(0, remainingAmount)
  const rate = annualInterestRate && annualInterestRate > 0 ? annualInterestRate : 0

  if (payment === 0) {
    return { interestAmount: 0, principalAmount: 0 }
  }

  if (remaining === 0) {
    return { interestAmount: 0, principalAmount: payment }
  }

  if (rate === 0) {
    const principalAmount = Math.min(payment, remaining)
    return {
      interestAmount: payment - principalAmount,
      principalAmount,
    }
  }

  const monthlyInterest = remaining * (rate / 100 / 12)
  const principalAmount = Math.min(
    remaining,
    Math.max(0, payment - monthlyInterest)
  )

  return {
    interestAmount: payment - principalAmount,
    principalAmount,
  }
}

export function buildAmortizationSchedule(
  remainingAmount: number,
  annualInterestRate: number | undefined,
  monthlyPayment: number,
  maxMonths = 600
): AmortizationRow[] {
  if (remainingAmount <= 0 || monthlyPayment <= 0) return []

  const monthlyRate = (annualInterestRate || 0) / 100 / 12
  const rows: AmortizationRow[] = []
  let balance = remainingAmount

  for (let month = 1; month <= maxMonths && balance > 0; month++) {
    const interest = balance * monthlyRate

    if (monthlyPayment <= interest) break

    const principal = Math.min(balance, monthlyPayment - interest)
    const payment = principal + interest
    balance = Math.max(0, balance - principal)

    rows.push({
      month,
      payment,
      interest,
      principal,
      balance,
    })
  }

  return rows
}

export function estimateDebtPayoff(debts: Debt[], now = new Date()): DebtPayoffProjection {
  const payables = debts.filter(
    debt => debt.type === 'payable' && debt.status !== 'paid' && debt.remainingAmount > 0
  )

  const totalDebt = payables.reduce((sum, debt) => sum + debt.remainingAmount, 0)
  const totalMinimumPayment = payables.reduce(
    (sum, debt) => sum + (debt.minimumPayment || 0),
    0
  )
  const weightedInterestRate = totalDebt > 0
    ? payables.reduce(
        (sum, debt) => sum + debt.remainingAmount * (debt.interestRate || 0),
        0
      ) / totalDebt
    : 0

  let longest = 0
  let hasMissingPayment = false
  let hasUnpayableDebt = false

  for (const debt of payables) {
    const payment = debt.minimumPayment || 0

    if (payment <= 0) {
      hasMissingPayment = true
      continue
    }

    const monthlyRate = (debt.interestRate || 0) / 100 / 12

    if (monthlyRate === 0) {
      longest = Math.max(longest, debt.remainingAmount / payment)
      continue
    }

    const monthlyInterest = debt.remainingAmount * monthlyRate

    if (payment <= monthlyInterest) {
      hasUnpayableDebt = true
      continue
    }

    const months = -Math.log(
      1 - (monthlyRate * debt.remainingAmount) / payment
    ) / Math.log(1 + monthlyRate)

    longest = Math.max(longest, months)
  }

  const canProject =
    payables.length > 0 &&
    !hasMissingPayment &&
    !hasUnpayableDebt &&
    longest > 0

  const months = canProject ? Math.ceil(longest) : null

  return {
    totalDebt,
    totalMinimumPayment,
    weightedInterestRate,
    months,
    debtFreeDate: months !== null ? addMonths(now, months) : null,
    hasMissingPayment,
    hasUnpayableDebt,
  }
}
