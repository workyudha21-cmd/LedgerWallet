export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investments",
  "Gift",
  "Other Income",
] as const

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Housing (Rent/Mortgage)",
  "Utilities",
  "Insurance",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Personal Care",
  "Education",
  "Travel",
  "Debt/Loan",
  "Other Expense",
] as const

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES] as const

export const ACCOUNT_TYPES = [
  "Cash",
  "Bank",
  "Wallet",
  "Investment",
  "Property",
  "Vehicle",
  "Other"
] as const

const LIQUID_ACCOUNT_TYPES = new Set<string>(["Cash", "Bank", "Wallet"])

export function isLiquidAccountType(type: string) {
  return LIQUID_ACCOUNT_TYPES.has(type)
}

export const ESSENTIAL_EXPENSE_CATEGORIES = new Set<string>([
  "Food & Dining",
  "Transportation",
  "Housing (Rent/Mortgage)",
  "Utilities",
  "Insurance",
  "Healthcare",
  "Education",
])

export const DISCRETIONARY_EXPENSE_CATEGORIES = new Set<string>([
  "Entertainment",
  "Shopping",
  "Personal Care",
  "Travel",
  "Other Expense",
])

export type CategoryGroup = 'income' | 'essential' | 'discretionary' | 'debt' | 'other'

export const EXPENSE_CATEGORY_GROUPS: CategoryGroup[] = [
  'essential',
  'discretionary',
  'debt',
  'other',
]

export function getDefaultCategoryGroup(name: string, type: 'income' | 'expense'): CategoryGroup {
  if (type === 'income') return 'income'
  if (name === 'Debt/Loan') return 'debt'
  if (ESSENTIAL_EXPENSE_CATEGORIES.has(name)) return 'essential'
  if (DISCRETIONARY_EXPENSE_CATEGORIES.has(name)) return 'discretionary'
  return 'other'
}
