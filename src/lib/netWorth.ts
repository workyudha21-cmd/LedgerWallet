import type { Account, Asset, Debt, FinancialGoal } from './store'

export interface NetWorthBreakdown {
  totalAccounts: number
  totalOtherAssets: number
  totalGoals: number
  totalReceivables: number
  totalAssets: number
  totalPayables: number
  netWorth: number
}

export function calculateNetWorth(
  accounts: Account[],
  assets: Asset[],
  goals: FinancialGoal[],
  debts: Debt[]
): NetWorthBreakdown {
  const activeDebts = debts.filter(d => d.status !== 'paid' && d.remainingAmount > 0)

  const totalAccounts = accounts
    .filter(account => account.includeInNetWorth !== false)
    .reduce((sum, account) => sum + (account.balance || 0), 0)

  const totalOtherAssets = assets
    .filter(asset => asset.includeInNetWorth !== false)
    .reduce((sum, asset) => sum + (asset.currentValue || 0), 0)

  const totalGoals = goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0)

  const totalReceivables = activeDebts
    .filter(d => d.type === 'receivable')
    .reduce((sum, d) => sum + (d.remainingAmount || 0), 0)

  const totalPayables = activeDebts
    .filter(d => d.type === 'payable')
    .reduce((sum, d) => sum + (d.remainingAmount || 0), 0)

  const totalAssets = totalAccounts + totalOtherAssets + totalGoals + totalReceivables

  return {
    totalAccounts,
    totalOtherAssets,
    totalGoals,
    totalReceivables,
    totalAssets,
    totalPayables,
    netWorth: totalAssets - totalPayables,
  }
}
