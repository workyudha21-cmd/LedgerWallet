import type { BackupData } from './store'

function hasIds(value: unknown) {
  return Array.isArray(value) && value.every((item) => (
    item !== null &&
    typeof item === "object" &&
    typeof (item as { id?: unknown }).id === "string"
  ))
}

function hasOptionalIds(value: unknown) {
  return value === undefined || hasIds(value)
}

export function isBackupData(value: unknown): value is BackupData {
  if (!value || typeof value !== "object") return false
  const data = value as Record<string, unknown>

  return (
    data.version === 1 &&
    (data.currency === "IDR" || data.currency === "USD") &&
    hasIds(data.accounts) &&
    hasOptionalIds(data.assets) &&
    hasIds(data.transactions) &&
    hasIds(data.categories) &&
    hasIds(data.budgets) &&
    hasIds(data.recurringTransactions) &&
    hasIds(data.goals) &&
    hasIds(data.debts) &&
    hasOptionalIds(data.healthSnapshots)
  )
}
