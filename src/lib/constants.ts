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
  "Other"
] as const
