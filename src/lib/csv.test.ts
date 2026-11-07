import { describe, expect, it } from 'vitest'
import { parseCsv, parseCsvAmount, parseTransactionCsv } from './csv'

const accounts = [
  { id: 'account-1', name: 'Cash' },
  { id: 'account-2', name: 'BCA' },
]

describe('parseCsv', () => {
  it('parses quoted fields, escaped quotes, and CRLF', () => {
    const rows = parseCsv('Date,Description,Amount\r\n2026-01-01,"Coffee, ""large""",25000\r\n')

    expect(rows).toEqual([
      ['Date', 'Description', 'Amount'],
      ['2026-01-01', 'Coffee, "large"', '25000'],
    ])
  })

  it('supports newlines inside quoted fields', () => {
    const rows = parseCsv('Date,Description\n2026-01-01,"Line one\nLine two"\n')

    expect(rows[1][1]).toBe('Line one\nLine two')
  })
})

describe('parseCsvAmount', () => {
  it('parses IDR grouping and decimal separators', () => {
    expect(parseCsvAmount('Rp 1.234.567', 'IDR')).toBe(1_234_567)
    expect(parseCsvAmount('1.234,56', 'IDR')).toBe(1_235)
    expect(parseCsvAmount('1,234,567', 'IDR')).toBe(1_234_567)
    expect(parseCsvAmount('1,000', 'IDR')).toBe(1_000)
    expect(parseCsvAmount('1000000.00', 'IDR')).toBe(1_000_000)
  })

  it('parses USD grouping and cents', () => {
    expect(parseCsvAmount('$1,234.56', 'USD')).toBe(1_234.56)
  })

  it('rejects empty, zero, and invalid amounts', () => {
    expect(parseCsvAmount('', 'IDR')).toBeNull()
    expect(parseCsvAmount('0', 'IDR')).toBeNull()
    expect(parseCsvAmount('not a number', 'IDR')).toBeNull()
  })
})

describe('parseTransactionCsv', () => {
  it('parses a valid CSV and matches accounts case-insensitively', () => {
    const result = parseTransactionCsv(
      [
        'Date,Description,Amount,Type,Category,Account',
        '2026-01-31,Salary,10000000,income,Salary,bca',
        '2026-02-01,Coffee,25000,expense,Food & Dining,Cash',
      ].join('\n'),
      { accounts, currency: 'IDR' }
    )

    expect(result.errors).toEqual([])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toMatchObject({
      description: 'Salary',
      amount: 10_000_000,
      type: 'income',
      category: 'Salary',
      accountId: 'account-2',
      accountName: 'BCA',
      rowNumber: 2,
    })
    expect(result.rows[1]).toMatchObject({
      type: 'expense',
      accountId: 'account-1',
      rowNumber: 3,
    })
  })

  it('accepts Indonesian headers and type aliases', () => {
    const result = parseTransactionCsv(
      [
        'Tanggal,Deskripsi,Jumlah,Tipe,Kategori,Akun',
        '31/01/2026,Belanja,1.234.567,pengeluaran,Belanja,Cash',
      ].join('\n'),
      { accounts, currency: 'IDR' }
    )

    expect(result.errors).toEqual([])
    expect(result.rows[0]).toMatchObject({
      description: 'Belanja',
      amount: 1_234_567,
      type: 'expense',
      accountId: 'account-1',
    })
  })

  it('falls back to default categories and the only account', () => {
    const result = parseTransactionCsv(
      'Date,Amount,Type\n2026-01-31,50000,expense',
      { accounts: [accounts[0]], currency: 'IDR' }
    )

    expect(result.errors).toEqual([])
    expect(result.rows[0]).toMatchObject({
      category: 'Other Expense',
      accountId: 'account-1',
      accountName: 'Cash',
    })
  })

  it('reports rows with unknown accounts, invalid dates, amounts, and types', () => {
    const result = parseTransactionCsv(
      [
        'Date,Amount,Type,Account',
        '2026-01-31,50000,expense,Unknown',
        'not-a-date,50000,expense,Cash',
        '2026-01-31,not-a-number,expense,Cash',
        '2026-01-31,50000,transfer,Cash',
      ].join('\n'),
      { accounts, currency: 'IDR' }
    )

    expect(result.rows).toHaveLength(0)
    expect(result.errors).toHaveLength(4)
    expect(result.errors[0]).toContain('Row 2')
    expect(result.errors[1]).toContain('invalid date')
    expect(result.errors[2]).toContain('invalid amount')
    expect(result.errors[3]).toContain('invalid type')
  })

  it('reports missing required headers', () => {
    const result = parseTransactionCsv('Date,Amount\n2026-01-31,50000', {
      accounts,
      currency: 'IDR',
    })

    expect(result.rows).toHaveLength(0)
    expect(result.errors[0]).toContain('Missing required column')
  })

  it('requires an account when there are multiple accounts', () => {
    const result = parseTransactionCsv('Date,Amount,Type\n2026-01-31,50000,expense', {
      accounts,
      currency: 'IDR',
    })

    expect(result.rows).toHaveLength(0)
    expect(result.errors[0]).toContain('account is required')
  })
})
