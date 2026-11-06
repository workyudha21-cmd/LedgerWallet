export interface FinancialTargets {
  emergencyFundMonths: number
  savingsRate: number
  maxDti: number
}

export const DEFAULT_FINANCIAL_TARGETS: FinancialTargets = {
  emergencyFundMonths: 6,
  savingsRate: 20,
  maxDti: 30,
}
