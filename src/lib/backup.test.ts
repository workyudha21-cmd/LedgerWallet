import { describe, expect, it } from 'vitest'
import { isBackupData } from './backup'

const validBackup = {
  version: 1,
  exportedAt: '2026-01-01T00:00:00.000Z',
  currency: 'IDR',
  accounts: [],
  transactions: [],
  categories: [],
  budgets: [],
  recurringTransactions: [],
  goals: [],
  debts: [],
}

describe('isBackupData', () => {
  it('accepts a valid backup', () => {
    expect(isBackupData(validBackup)).toBe(true)
  })

  it('accepts items with ids', () => {
    expect(isBackupData({
      ...validBackup,
      accounts: [{ id: 'account-1', name: 'Cash' }],
    })).toBe(true)
  })

  it('rejects unsupported versions and currencies', () => {
    expect(isBackupData({ ...validBackup, version: 2 })).toBe(false)
    expect(isBackupData({ ...validBackup, currency: 'EUR' })).toBe(false)
  })

  it('rejects missing collections', () => {
    const { transactions, ...withoutTransactions } = validBackup
    expect(transactions).toBeDefined()
    expect(isBackupData(withoutTransactions)).toBe(false)
  })

  it('rejects items without string ids', () => {
    expect(isBackupData({
      ...validBackup,
      accounts: [{ name: 'Cash' }],
    })).toBe(false)
  })
})
