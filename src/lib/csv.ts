import { isValid, parseISO } from 'date-fns'

export interface CsvAccount {
  id: string
  name: string
}

export interface CsvParseOptions {
  accounts: CsvAccount[]
  currency: 'IDR' | 'USD'
}

export interface CsvImportRow {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  accountId: string
  accountName: string
  rowNumber: number
}

export interface CsvParseResult {
  rows: CsvImportRow[]
  errors: string[]
}

export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < source.length; index++) {
    const char = source[index]

    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"'
          index++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((item) => item.some((cell) => cell.trim() !== ''))
}

export function parseCsvAmount(raw: string, currency: 'IDR' | 'USD'): number | null {
  const cleaned = raw.replace(/[^\d.,-]/g, '')
  if (!cleaned) return null

  let normalized = cleaned
  const commaCount = (cleaned.match(/,/g) || []).length

  if (currency === 'IDR') {
    if (commaCount === 0) {
      const dotParts = cleaned.split('.')
      normalized = dotParts.length === 2 && dotParts[1].length !== 3
        ? cleaned
        : cleaned.replace(/\./g, '')
    } else if (commaCount === 1 && cleaned.includes('.')) {
      normalized = cleaned.indexOf(',') > cleaned.indexOf('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '')
    } else if (commaCount === 1) {
      const commaParts = cleaned.split(',')
      normalized = commaParts.length === 2 && commaParts[1].length === 3
        ? cleaned.replace(',', '')
        : cleaned.replace(',', '.')
    } else {
      normalized = cleaned.replace(/[,.]/g, '')
    }
  } else {
    normalized = cleaned.replace(/,/g, '')
  }

  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) return null

  return currency === 'IDR' ? Math.round(value) : Math.round(value * 100) / 100
}

function parseCsvDate(value: string, currency: 'IDR' | 'USD'): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed)) {
    const parsed = parseISO(trimmed)
    return isValid(parsed) ? parsed : null
  }

  const dayFirst = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (dayFirst) {
    const first = Number(dayFirst[1])
    const second = Number(dayFirst[2])
    const year = Number(dayFirst[3])
    const month = currency === 'USD' ? first : second
    const day = currency === 'USD' ? second : first
    const parsed = new Date(year, month - 1, day)
    return parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
      ? parsed
      : null
  }

  const yearFirst = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/)
  if (yearFirst) {
    const year = Number(yearFirst[1])
    const month = Number(yearFirst[2])
    const day = Number(yearFirst[3])
    const parsed = new Date(year, month - 1, day)
    return parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
      ? parsed
      : null
  }

  return null
}

function parseCsvType(value: string): 'income' | 'expense' | null {
  const normalized = value.trim().toLowerCase()

  if (['income', 'pemasukan', 'masuk', 'credit', 'kredit', 'in'].includes(normalized)) {
    return 'income'
  }

  if (['expense', 'pengeluaran', 'keluar', 'debit', 'out'].includes(normalized)) {
    return 'expense'
  }

  return null
}

type Column = 'date' | 'description' | 'amount' | 'type' | 'category' | 'account'

function resolveColumn(value: string): Column | null {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!normalized) return null

  if (normalized.includes('date') || normalized.includes('tanggal')) return 'date'
  if (normalized.includes('amount') || normalized.includes('jumlah') || normalized.includes('nominal')) return 'amount'
  if (normalized.includes('description') || normalized.includes('deskripsi') || normalized.includes('memo') || normalized.includes('note')) return 'description'
  if (normalized.includes('category') || normalized.includes('kategori')) return 'category'
  if (normalized.includes('account') || normalized.includes('akun') || normalized.includes('wallet')) return 'account'
  if (normalized.includes('type') || normalized.includes('tipe') || normalized.includes('jenis')) return 'type'

  return null
}

export function parseTransactionCsv(text: string, options: CsvParseOptions): CsvParseResult {
  const rows = parseCsv(text)
  const errors: string[] = []

  if (rows.length === 0) {
    return { rows: [], errors: ['The CSV file is empty.'] }
  }

  const headerMap = new Map<Column, number>()
  rows[0].forEach((header, index) => {
    const column = resolveColumn(header)
    if (column && !headerMap.has(column)) {
      headerMap.set(column, index)
    }
  })

  const requiredColumns: Column[] = ['date', 'amount', 'type']
  const missingColumns = requiredColumns.filter((column) => !headerMap.has(column))
  if (missingColumns.length > 0) {
    return {
      rows: [],
      errors: [
        `Missing required column(s): ${missingColumns.join(', ')}. Use headers: Date, Description, Amount, Type, Category, Account.`,
      ],
    }
  }

  if (!headerMap.has('account') && options.accounts.length !== 1) {
    return {
      rows: [],
      errors: ['account is required when you have more than one account.'],
    }
  }

  const parsedRows: CsvImportRow[] = []

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2
    const get = (column: Column) => {
      const columnIndex = headerMap.get(column)
      return columnIndex === undefined ? '' : (row[columnIndex] || '').trim()
    }

    const rawDate = get('date')
    const rawAmount = get('amount')
    const rawType = get('type')
    const rawAccount = get('account')
    const rawCategory = get('category')
    const description = get('description')

    if (!rawDate && !rawAmount && !rawType && !rawAccount && !rawCategory && !description) {
      return
    }

    const date = parseCsvDate(rawDate, options.currency)
    if (!date) {
      errors.push(`Row ${rowNumber}: invalid date "${rawDate}".`)
      return
    }

    const amount = parseCsvAmount(rawAmount, options.currency)
    if (amount === null) {
      errors.push(`Row ${rowNumber}: invalid amount "${rawAmount}".`)
      return
    }

    const type = parseCsvType(rawType)
    if (!type) {
      errors.push(`Row ${rowNumber}: invalid type "${rawType}". Use income or expense.`)
      return
    }

    const account = rawAccount
      ? options.accounts.find((item) => item.name.toLowerCase() === rawAccount.toLowerCase())
      : options.accounts.length === 1
        ? options.accounts[0]
        : undefined

    if (!account) {
      errors.push(
        rawAccount
          ? `Row ${rowNumber}: account "${rawAccount}" was not found.`
          : `Row ${rowNumber}: account is required when you have more than one account.`
      )
      return
    }

    parsedRows.push({
      date: date.toISOString(),
      description,
      amount,
      type,
      category: rawCategory || (type === 'income' ? 'Other Income' : 'Other Expense'),
      accountId: account.id,
      accountName: account.name,
      rowNumber,
    })
  })

  if (parsedRows.length === 0 && errors.length === 0) {
    errors.push('No transaction rows found in the CSV file.')
  }

  return { rows: parsedRows, errors }
}
