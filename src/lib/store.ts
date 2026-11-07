import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from './firebase'
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    Timestamp,
    getDoc,
    getDocs,
    setDoc,
    writeBatch,
    increment,
    runTransaction
} from 'firebase/firestore'
import {
    INCOME_CATEGORIES,
    EXPENSE_CATEGORIES,
    ACCOUNT_TYPES,
    getDefaultCategoryGroup,
    isLegacyAssetAccountType,
    type AssetCategory,
    type CategoryGroup,
    type LiabilityType
} from './constants'
import {
    DEFAULT_FINANCIAL_TARGETS,
    type FinancialTargets
} from './financialTargets'
import { estimatePayoffAmount, splitDebtPayment } from './debt'
import { notifyError } from './toast'

export type TransactionType = 'income' | 'expense'
export type TransactionKind = TransactionType | 'transfer' | 'savings'

export interface Account {
    id: string
    userId: string
    name: string
    type: typeof ACCOUNT_TYPES[number]
    balance: number
    color?: string
    isLiquid?: boolean
    isEmergencyFund?: boolean
    includeInNetWorth?: boolean
    purchasePrice?: number
    purchaseDate?: string | null
    valuationDate?: string | null
    notes?: string
}

export interface Asset {
    id: string
    userId: string
    name: string
    category: AssetCategory
    currentValue: number
    purchasePrice?: number
    purchaseDate?: string | null
    valuationDate?: string | null
    notes?: string
    includeInNetWorth?: boolean
    createdAt?: Timestamp
}

export interface Transaction {
    id: string
    amount: number
    type: TransactionKind
    category: string
    description?: string
    date: string
    userId: string
    accountId: string
    toAccountId?: string
    goalId?: string
    debtId?: string
    assetId?: string
    interestAmount?: number
    principalAmount?: number
}

export type TransactionFormValues = Omit<Transaction, 'id' | 'userId'>

export interface TransactionImportRow {
    date: string
    description: string
    amount: number
    type: 'income' | 'expense'
    category: string
    accountId: string
}

export interface Category {
    id: string
    name: string
    type: TransactionType
    userId: string
    isDefault?: boolean
    group?: CategoryGroup
}

export interface Budget {
    id: string
    category: string
    amount: number
    userId: string
}

export type RecurringLinkType = 'debt' | 'asset' | 'goal'

export interface RecurringTransaction {
    id: string
    userId: string
    name: string
    amount: number
    type: TransactionType | 'savings'
    category: string
    accountId: string
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    startDate: string // ISO string
    nextRunDate: string // ISO string
    active: boolean
    lastRunDate?: string
    linkType?: RecurringLinkType | null
    linkId?: string | null
}

export interface FinancialGoal {
    id: string
    userId: string
    name: string
    targetAmount: number
    currentAmount: number
    deadline?: string | null
    color?: string
}

export interface Debt {
    id: string
    userId: string
    type: 'payable' | 'receivable'
    personName: string
    totalAmount: number
    remainingAmount: number
    minimumPayment?: number
    interestRate?: number
    liabilityType?: LiabilityType | null
    creditLimit?: number | null
    statementDay?: number | null
    assetId?: string | null
    dueDate?: string | null // ISO string
    description?: string
    status: 'active' | 'paid'
    createdAt: Timestamp
}

export interface HealthSnapshot {
    id: string
    userId: string
    month: string
    score: number
    status: 'Insufficient Data' | 'Critical' | 'Fair' | 'Good' | 'Excellent'
    netWorth: number
    savingsRatio: number
    debtToIncomeRatio: number
    emergencyFundRatio: number
    expenseRatio: number
    funRatio: number
    updatedAt?: Timestamp
}

export type HealthSnapshotPayload = Omit<HealthSnapshot, 'id' | 'userId' | 'updatedAt'>

export interface BackupData {
    version: 1
    exportedAt: string
    currency: 'IDR' | 'USD'
    financialTargets?: FinancialTargets
    accounts: Account[]
    assets?: Asset[]
    transactions: Transaction[]
    categories: Category[]
    budgets: Budget[]
    recurringTransactions: RecurringTransaction[]
    goals: FinancialGoal[]
    debts: Debt[]
    healthSnapshots?: HealthSnapshot[]
}

interface TransactionState {
    transactions: Transaction[]
    categories: Category[]
    budgets: Budget[]
    accounts: Account[]
    assets: Asset[]
    recurringTransactions: RecurringTransaction[]
    goals: FinancialGoal[]
    debts: Debt[]
    healthSnapshots: HealthSnapshot[]
    currency: 'IDR' | 'USD'
    financialTargets: FinancialTargets
    loading: boolean
    setCurrency: (currency: 'IDR' | 'USD') => void
    setFinancialTargets: (targets: Partial<FinancialTargets>) => void

    // Async Actions
    addTransaction: (transaction: TransactionFormValues, userId: string) => Promise<void>
    importTransactions: (rows: TransactionImportRow[], userId: string) => Promise<number>
    transferBetweenAccounts: (transfer: {
        fromAccountId: string
        toAccountId: string
        amount: number
        date: string
        description?: string
    }, userId: string) => Promise<void>
    removeTransaction: (id: string) => Promise<void>
    editTransaction: (id: string, updates: Partial<TransactionFormValues>) => Promise<void>

    addCategory: (category: Omit<Category, 'id' | 'userId'>, userId: string) => Promise<void>
    editCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'userId'>>) => Promise<void>
    removeCategory: (id: string) => Promise<void>
    seedDefaults: (userId: string) => Promise<void>

    addBudget: (budget: Omit<Budget, 'id' | 'userId'>, userId: string) => Promise<void>
    removeBudget: (id: string) => Promise<void>

    addAccount: (account: Omit<Account, 'id' | 'userId'>, userId: string) => Promise<void>
    removeAccount: (id: string) => Promise<void>
    editAccount: (id: string, updates: Partial<Omit<Account, 'id' | 'userId'>>) => Promise<void>

    // Asset Actions
    addAsset: (asset: Omit<Asset, 'id' | 'userId' | 'createdAt'>, userId: string) => Promise<void>
    removeAsset: (id: string) => Promise<void>
    editAsset: (id: string, updates: Partial<Omit<Asset, 'id' | 'userId' | 'createdAt'>>) => Promise<void>
    contributeToAsset: (contribution: {
        assetId: string
        accountId: string
        amount: number
        date: string
        description?: string
    }, userId: string) => Promise<void>
    subscribeToAssets: (userId: string) => () => void

    // Recurring Actions
    addRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id' | 'userId'>, userId: string) => Promise<void>
    editRecurringTransaction: (id: string, updates: Partial<Omit<RecurringTransaction, 'id' | 'userId'>>) => Promise<void>
    deleteRecurringTransaction: (id: string) => Promise<void>
    processRecurringTransactions: (userId: string) => Promise<void>

    // Real-time Subscription
    subscribeToTransactions: (userId: string) => () => void
    subscribeToCategories: (userId: string) => () => void
    subscribeToBudgets: (userId: string) => () => void
    subscribeToAccounts: (userId: string) => () => void
    subscribeToRecurringTransactions: (userId: string) => () => void

    // Goals Actions
    addGoal: (goal: Omit<FinancialGoal, 'id' | 'userId'>, userId: string) => Promise<void>
    editGoal: (id: string, updates: Partial<Omit<FinancialGoal, 'id' | 'userId'>>) => Promise<void>
    deleteGoal: (id: string) => Promise<void>
    contributeToGoal: (goalId: string, accountId: string, amount: number, userId: string) => Promise<void>
    subscribeToGoals: (userId: string) => () => void

    // Debt Actions
    addDebt: (debt: Omit<Debt, 'id' | 'userId' | 'remainingAmount' | 'status' | 'createdAt'>, userId: string) => Promise<void>
    editDebt: (id: string, updates: Partial<Omit<Debt, 'id' | 'userId' | 'createdAt'>>) => Promise<void>
    deleteDebt: (id: string) => Promise<void>
    payDebt: (debtId: string, amount: number, accountId: string, userId: string) => Promise<void>
    subscribeToDebts: (userId: string) => () => void

    // Health History
    saveHealthSnapshot: (snapshot: HealthSnapshotPayload, userId: string) => Promise<void>
    subscribeToHealthSnapshots: (userId: string) => () => void

    // Reset Data
    resetData: (userId: string) => Promise<void>
    deleteAccountData: (userId: string) => Promise<void>
    importBackup: (backup: BackupData, userId: string) => Promise<void>
}

let isProcessingRecurring = false
let isMigratingLegacyGoalContributions = false
let isMigratingLegacyAssets = false
let isMigratingInvestmentLabels = false
let isMigratingInvestmentTransactions = false
let isMigratingInvestmentRecurring = false

async function deleteUserDocuments(collectionName: string, userId: string) {
    const q = query(collection(db, collectionName), where('userId', '==', userId))
    const snapshot = await getDocs(q)

    for (let index = 0; index < snapshot.docs.length; index += 450) {
        const batch = writeBatch(db)
        snapshot.docs.slice(index, index + 450).forEach((docSnapshot) => {
            batch.delete(docSnapshot.ref)
        })
        await batch.commit()
    }
}

async function migrateLegacyAssetAccounts(
    legacyAccounts: Account[],
    userId: string,
    onMigrated: (assets: Asset[]) => void
): Promise<boolean> {
    if (isMigratingLegacyAssets) return true
    isMigratingLegacyAssets = true

    try {
        const createdAt = Timestamp.now()
        const migratedAssets: Asset[] = legacyAccounts.map(account => ({
            id: account.id,
            userId,
            name: account.name,
            category: account.type as AssetCategory,
            currentValue: account.balance,
            purchasePrice: account.purchasePrice || 0,
            purchaseDate: account.purchaseDate || null,
            valuationDate: account.valuationDate || null,
            notes: account.notes || "",
            includeInNetWorth: account.includeInNetWorth ?? true,
            createdAt,
        }))

        const legacyIds = new Set(legacyAccounts.map(account => account.id))
        const transactionSnapshot = await getDocs(
            query(collection(db, 'transactions'), where('userId', '==', userId))
        )
        const recurringSnapshot = await getDocs(
            query(collection(db, 'recurring_transactions'), where('userId', '==', userId))
        )

        const batch = writeBatch(db)

        migratedAssets.forEach(asset => {
            const { id, ...data } = asset
            batch.set(doc(db, 'assets', id), data)
            batch.delete(doc(db, 'accounts', id))
        })

        transactionSnapshot.docs.forEach(docSnapshot => {
            const data = docSnapshot.data()
            const updates: Record<string, string> = {}

            if (legacyIds.has(data.accountId)) updates.accountId = ""
            if (legacyIds.has(data.toAccountId)) updates.toAccountId = ""

            if (Object.keys(updates).length > 0) {
                batch.update(docSnapshot.ref, updates)
            }
        })

        recurringSnapshot.docs.forEach(docSnapshot => {
            if (legacyIds.has(docSnapshot.data().accountId)) {
                batch.update(docSnapshot.ref, { accountId: "", active: false })
            }
        })

        await batch.commit()
        onMigrated(migratedAssets)
        return true
    } catch (error) {
        console.error("Error migrating legacy asset accounts:", error)
        return false
    } finally {
        isMigratingLegacyAssets = false
    }
}

function getNextRunDate(date: Date, frequency: RecurringTransaction['frequency']): Date {
    const next = new Date(date)
    switch (frequency) {
        case 'daily': next.setDate(next.getDate() + 1); break
        case 'weekly': next.setDate(next.getDate() + 7); break
        case 'monthly': {
            const day = next.getDate()
            next.setDate(1)
            next.setMonth(next.getMonth() + 1)
            const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
            next.setDate(Math.min(day, daysInMonth))
            break
        }
        case 'yearly': next.setFullYear(next.getFullYear() + 1); break
    }
    return next
}

export const useTransactionStore = create<TransactionState>()(
    persist(
        (set, get) => ({
            transactions: [],
            categories: [],
            budgets: [],
            accounts: [],
            assets: [],
            recurringTransactions: [],
            goals: [],
            debts: [],
            healthSnapshots: [],
            currency: 'IDR',
            financialTargets: DEFAULT_FINANCIAL_TARGETS,
            loading: false,

            setCurrency: (currency) => set({ currency }),

            setFinancialTargets: (targets) => set((state) => ({
                financialTargets: {
                    ...state.financialTargets,
                    ...targets
                }
            })),

            addTransaction: async (formData, userId) => {
                try {
                    const batch = writeBatch(db)
                    const transactionData: Record<string, unknown> = {
                        ...formData,
                        userId,
                        createdAt: Timestamp.now()
                    }

                    if (formData.debtId && formData.type === 'expense') {
                        const debtRef = doc(db, 'debts', formData.debtId)
                        const debtSnap = await getDoc(debtRef)

                        if (debtSnap.exists()) {
                            const debt = debtSnap.data() as Debt

                            if (debt.type === 'payable') {
                                const maxPayment = estimatePayoffAmount(debt.remainingAmount, debt.interestRate)
                                if (formData.amount > maxPayment) {
                                    throw new Error("Amount exceeds the estimated payoff")
                                }

                                const split = debt.interestRate && debt.interestRate > 0
                                    ? splitDebtPayment(formData.amount, debt.remainingAmount, debt.interestRate)
                                    : null

                                if (split) {
                                    transactionData.interestAmount = split.interestAmount
                                    transactionData.principalAmount = split.principalAmount
                                }

                                const principalReduction = split ? split.principalAmount : formData.amount
                                batch.update(debtRef, {
                                    remainingAmount: increment(-principalReduction),
                                    status: debt.remainingAmount - principalReduction <= 0 ? 'paid' : 'active'
                                })
                            } else {
                                delete transactionData.debtId
                            }
                        } else {
                            delete transactionData.debtId
                        }
                    } else if (formData.debtId) {
                        delete transactionData.debtId
                    }

                    // 1. Transaction
                    const newTransRef = doc(collection(db, 'transactions'))
                    batch.set(newTransRef, transactionData)

                    // 2. Account Balance
                    if (formData.accountId) {
                        const accountRef = doc(db, 'accounts', formData.accountId)
                        const accountSnap = await getDoc(accountRef)

                        if (accountSnap.exists()) {
                            const delta = formData.type === 'income' ? formData.amount : -formData.amount
                            batch.update(accountRef, { balance: increment(delta) })
                        }
                    }

                    await batch.commit()
                } catch (error) {
                    console.error("Error adding transaction: ", error)
                    notifyError(`Failed to save transaction: ${(error as Error).message}`)
                }
            },

            importTransactions: async (rows, userId) => {
                if (rows.length === 0) return 0

                const accountIds = new Set(get().accounts.map(account => account.id))
                rows.forEach((row, index) => {
                    if (!accountIds.has(row.accountId)) {
                        throw new Error(`Row ${index + 1}: account not found`)
                    }
                    if (!Number.isFinite(row.amount) || row.amount <= 0) {
                        throw new Error(`Row ${index + 1}: amount must be greater than 0`)
                    }
                    if (row.type !== 'income' && row.type !== 'expense') {
                        throw new Error(`Row ${index + 1}: type must be income or expense`)
                    }
                })

                const CHUNK_SIZE = 300

                for (let index = 0; index < rows.length; index += CHUNK_SIZE) {
                    const chunk = rows.slice(index, index + CHUNK_SIZE)
                    const batch = writeBatch(db)
                    const accountDeltas = new Map<string, number>()

                    chunk.forEach((row) => {
                        const transactionRef = doc(collection(db, 'transactions'))
                        batch.set(transactionRef, {
                            amount: row.amount,
                            type: row.type,
                            category: row.category,
                            description: row.description || 'Imported transaction',
                            date: row.date,
                            userId,
                            accountId: row.accountId,
                            createdAt: Timestamp.now()
                        })

                        const delta = row.type === 'income' ? row.amount : -row.amount
                        accountDeltas.set(row.accountId, (accountDeltas.get(row.accountId) || 0) + delta)
                    })

                    accountDeltas.forEach((delta, accountId) => {
                        if (delta !== 0) {
                            batch.update(doc(db, 'accounts', accountId), { balance: increment(delta) })
                        }
                    })

                    await batch.commit()
                }

                return rows.length
            },

            transferBetweenAccounts: async (transfer, userId) => {
                const { accounts } = get()
                const from = accounts.find(a => a.id === transfer.fromAccountId)
                const to = accounts.find(a => a.id === transfer.toAccountId)

                if (!from || !to) throw new Error("Account not found")
                if (from.id === to.id) throw new Error("Source and destination accounts must be different")
                if (transfer.amount <= 0) throw new Error("Transfer amount must be greater than 0")
                if (from.balance < transfer.amount) throw new Error("Insufficient funds in source account")

                const batch = writeBatch(db)
                const newTransRef = doc(collection(db, 'transactions'))
                batch.set(newTransRef, {
                    amount: transfer.amount,
                    type: 'transfer',
                    category: 'Transfer',
                    description: transfer.description || `Transfer ${from.name} to ${to.name}`,
                    date: transfer.date,
                    userId,
                    accountId: transfer.fromAccountId,
                    toAccountId: transfer.toAccountId,
                    createdAt: Timestamp.now()
                })

                batch.update(doc(db, 'accounts', transfer.fromAccountId), { balance: increment(-transfer.amount) })
                batch.update(doc(db, 'accounts', transfer.toAccountId), { balance: increment(transfer.amount) })

                await batch.commit()
            },

            removeTransaction: async (id) => {
                try {
                    const trans = get().transactions.find(t => t.id === id)
                    if (!trans) return

                    const batch = writeBatch(db)
                    batch.delete(doc(db, 'transactions', id))

                    if (trans.accountId) {
                        const accountRef = doc(db, 'accounts', trans.accountId)
                        const accountSnap = await getDoc(accountRef)
                        if (accountSnap.exists()) {
                            const delta = trans.type === 'income' ? -trans.amount : trans.amount
                            batch.update(accountRef, { balance: increment(delta) })
                        }
                    }

                    if (trans.toAccountId) {
                        const toAccountRef = doc(db, 'accounts', trans.toAccountId)
                        const toAccountSnap = await getDoc(toAccountRef)
                        if (toAccountSnap.exists()) {
                            batch.update(toAccountRef, { balance: increment(-trans.amount) })
                        }
                    }

                    if (trans.goalId) {
                        const goalRef = doc(db, 'goals', trans.goalId)
                        const goalSnap = await getDoc(goalRef)
                        if (goalSnap.exists()) {
                            batch.update(goalRef, { currentAmount: increment(-trans.amount) })
                        }
                    }

                    if (trans.debtId) {
                        const debtRef = doc(db, 'debts', trans.debtId)
                        const debtSnap = await getDoc(debtRef)
                        if (debtSnap.exists()) {
                            const principalRestore = typeof trans.principalAmount === 'number'
                                ? trans.principalAmount
                                : trans.amount

                            batch.update(debtRef, {
                                remainingAmount: increment(principalRestore),
                                status: 'active'
                            })
                        }
                    }

                    if (trans.assetId) {
                        const assetRef = doc(db, 'assets', trans.assetId)
                        const assetSnap = await getDoc(assetRef)
                        if (assetSnap.exists()) {
                            batch.update(assetRef, { currentValue: increment(-trans.amount) })
                        }
                    }

                    await batch.commit()
                } catch (error) {
                    console.error("Error deleting transaction: ", error)
                    notifyError(`Failed to delete transaction: ${(error as Error).message}`)
                }
            },

            editTransaction: async (id, updates) => {
                try {
                    const oldTrans = get().transactions.find(t => t.id === id)
                    if (!oldTrans) return

                    const batch = writeBatch(db)
                    const transRef = doc(db, 'transactions', id)
                    const transactionUpdates: Partial<Transaction> = { ...updates }
                    const newTrans = { ...oldTrans, ...updates }

                    if (oldTrans.debtId) {
                        delete transactionUpdates.debtId
                    } else if (updates.debtId && newTrans.type === 'expense') {
                        const debtRef = doc(db, 'debts', updates.debtId)
                        const debtSnap = await getDoc(debtRef)

                        if (debtSnap.exists()) {
                            const debt = debtSnap.data() as Debt
                            if (debt.type === 'payable') {
                                const maxPayment = estimatePayoffAmount(debt.remainingAmount, debt.interestRate)
                                if (newTrans.amount > maxPayment) {
                                    throw new Error("Amount exceeds the estimated payoff")
                                }

                                const split = debt.interestRate && debt.interestRate > 0
                                    ? splitDebtPayment(newTrans.amount, debt.remainingAmount, debt.interestRate)
                                    : null

                                if (split) {
                                    transactionUpdates.interestAmount = split.interestAmount
                                    transactionUpdates.principalAmount = split.principalAmount
                                }

                                const principalReduction = split ? split.principalAmount : newTrans.amount
                                batch.update(debtRef, {
                                    remainingAmount: increment(-principalReduction),
                                    status: debt.remainingAmount - principalReduction <= 0 ? 'paid' : 'active'
                                })
                            } else {
                                delete transactionUpdates.debtId
                            }
                        } else {
                            delete transactionUpdates.debtId
                        }
                    } else if (updates.debtId) {
                        delete transactionUpdates.debtId
                    }

                    batch.update(transRef, transactionUpdates)

                    const impactChanged =
                        oldTrans.amount !== newTrans.amount ||
                        oldTrans.type !== newTrans.type ||
                        oldTrans.accountId !== newTrans.accountId

                    if (impactChanged) {
                        const oldDelta = oldTrans.type === 'income' ? -oldTrans.amount : oldTrans.amount
                        const newDelta = newTrans.type === 'income' ? newTrans.amount : -newTrans.amount

                        if (oldTrans.accountId && oldTrans.accountId === newTrans.accountId) {
                            const delta = oldDelta + newDelta
                            if (delta !== 0) {
                                const accountRef = doc(db, 'accounts', oldTrans.accountId)
                                const accountSnap = await getDoc(accountRef)
                                if (accountSnap.exists()) {
                                    batch.update(accountRef, { balance: increment(delta) })
                                }
                            }
                        } else {
                            if (oldTrans.accountId) {
                                const oldAccRef = doc(db, 'accounts', oldTrans.accountId)
                                const oldAccSnap = await getDoc(oldAccRef)
                                if (oldAccSnap.exists()) {
                                    batch.update(oldAccRef, { balance: increment(oldDelta) })
                                }
                            }
                            if (newTrans.accountId) {
                                const newAccRef = doc(db, 'accounts', newTrans.accountId)
                                const newAccSnap = await getDoc(newAccRef)
                                if (newAccSnap.exists()) {
                                    batch.update(newAccRef, { balance: increment(newDelta) })
                                }
                            }
                        }
                    }
                    await batch.commit()
                } catch (error) {
                    console.error("Error updating transaction: ", error)
                    notifyError(`Failed to update transaction: ${(error as Error).message}`)
                }
            },

            addCategory: async (category, userId) => {
                try {
                    await addDoc(collection(db, 'categories'), {
                        ...category,
                        userId,
                        createdAt: Timestamp.now()
                    })
                } catch (error) {
                    console.error("Error adding category: ", error)
                    notifyError(`Failed to add category: ${(error as Error).message}`)
                }
            },

            editCategory: async (id, updates) => {
                try {
                    await updateDoc(doc(db, 'categories', id), updates)
                } catch (error) {
                    console.error("Error updating category: ", error)
                }
            },

            seedDefaults: async (userId) => {
                const { addCategory } = get()
                for (const cat of INCOME_CATEGORIES) {
                    await addCategory({
                        name: cat,
                        type: 'income',
                        group: 'income'
                    }, userId)
                }
                for (const cat of EXPENSE_CATEGORIES) {
                    await addCategory({
                        name: cat,
                        type: 'expense',
                        group: getDefaultCategoryGroup(cat, 'expense')
                    }, userId)
                }
            },

            removeCategory: async (id) => {
                try {
                    await deleteDoc(doc(db, 'categories', id))
                } catch (error) {
                    console.error("Error removing category: ", error)
                    notifyError(`Failed to remove category: ${(error as Error).message}`)
                }
            },

            addBudget: async (budget, userId) => {
                try {
                    const budgets = get().budgets
                    const existing = budgets.find(b => b.category === budget.category && b.userId === userId)

                    if (existing) {
                        await updateDoc(doc(db, 'budgets', existing.id), { amount: budget.amount })
                    } else {
                        await addDoc(collection(db, 'budgets'), {
                            ...budget,
                            userId,
                            createdAt: Timestamp.now()
                        })
                    }
                } catch (error) {
                    console.error("Error adding/updating budget: ", error)
                    notifyError(`Failed to save budget: ${(error as Error).message}`)
                }
            },

            removeBudget: async (id) => {
                try {
                    await deleteDoc(doc(db, 'budgets', id))
                } catch (error) {
                    console.error("Error removing budget: ", error)
                    notifyError(`Failed to remove budget: ${(error as Error).message}`)
                }
            },

            addAccount: async (account, userId) => {
                try {
                    await addDoc(collection(db, 'accounts'), {
                        ...account,
                        userId,
                        createdAt: Timestamp.now()
                    })
                } catch (e) {
                    console.error("Error adding account:", e)
                    notifyError(`Failed to add account: ${(e as Error).message}`)
                }
            },
            removeAccount: async (id) => {
                try {
                    const account = get().accounts.find(a => a.id === id)
                    const userId = account?.userId

                    if (userId) {
                        const transactionSnapshot = await getDocs(
                            query(collection(db, 'transactions'), where('userId', '==', userId))
                        )

                        const transactionUpdates = transactionSnapshot.docs.flatMap((transactionDoc) => {
                            const data = transactionDoc.data()
                            const updates: Record<string, string> = {}

                            if (data.accountId === id) updates.accountId = ""
                            if (data.toAccountId === id) updates.toAccountId = ""

                            return Object.keys(updates).length > 0
                                ? [{ ref: transactionDoc.ref, updates }]
                                : []
                        })

                        for (let index = 0; index < transactionUpdates.length; index += 450) {
                            const batch = writeBatch(db)
                            transactionUpdates.slice(index, index + 450).forEach(({ ref, updates }) => {
                                batch.update(ref, updates)
                            })
                            await batch.commit()
                        }

                        const recurringSnapshot = await getDocs(
                            query(collection(db, 'recurring_transactions'), where('userId', '==', userId))
                        )

                        const recurringRefs = recurringSnapshot.docs
                            .filter((recurringDoc) => recurringDoc.data().accountId === id)
                            .map((recurringDoc) => recurringDoc.ref)

                        for (let index = 0; index < recurringRefs.length; index += 450) {
                            const batch = writeBatch(db)
                            recurringRefs.slice(index, index + 450).forEach((ref) => {
                                batch.update(ref, { active: false, accountId: "" })
                            })
                            await batch.commit()
                        }
                    }

                    await deleteDoc(doc(db, 'accounts', id))
                } catch (e) {
                    console.error(e)
                    notifyError(`Failed to remove account: ${(e as Error).message}`)
                }
            },
            editAccount: async (id, updates) => {
                try {
                    await updateDoc(doc(db, 'accounts', id), updates)
                } catch (e) {
                    console.error(e)
                    notifyError(`Failed to update account: ${(e as Error).message}`)
                }
            },

            addAsset: async (asset, userId) => {
                try {
                    await addDoc(collection(db, 'assets'), {
                        ...asset,
                        userId,
                        createdAt: Timestamp.now()
                    })
                } catch (e) {
                    console.error("Error adding asset:", e)
                    notifyError(`Failed to add asset: ${(e as Error).message}`)
                }
            },
            editAsset: async (id, updates) => {
                try {
                    await updateDoc(doc(db, 'assets', id), updates)
                } catch (e) {
                    console.error("Error editing asset:", e)
                    notifyError(`Failed to update asset: ${(e as Error).message}`)
                }
            },
            removeAsset: async (id) => {
                try {
                    const asset = get().assets.find(a => a.id === id)
                    const linkedDebts = get().debts.filter(debt => debt.assetId === id)
                    const batch = writeBatch(db)

                    linkedDebts.forEach(debt => {
                        batch.update(doc(db, 'debts', debt.id), { assetId: null })
                    })

                    batch.delete(doc(db, 'assets', id))
                    await batch.commit()

                    if (asset?.userId) {
                        const transactionSnapshot = await getDocs(
                            query(collection(db, 'transactions'), where('userId', '==', asset.userId))
                        )
                        const transactionUpdates = transactionSnapshot.docs.flatMap((transactionDoc) => {
                            const data = transactionDoc.data()
                            return data.assetId === id
                                ? [{ ref: transactionDoc.ref, updates: { assetId: "" } }]
                                : []
                        })

                        for (let index = 0; index < transactionUpdates.length; index += 450) {
                            const unlinkBatch = writeBatch(db)
                            transactionUpdates.slice(index, index + 450).forEach(({ ref, updates }) => {
                                unlinkBatch.update(ref, updates)
                            })
                            await unlinkBatch.commit()
                        }
                    }
                } catch (e) {
                    console.error("Error removing asset:", e)
                    notifyError(`Failed to remove asset: ${(e as Error).message}`)
                }
            },
            contributeToAsset: async (contribution, userId) => {
                const { accounts, assets } = get()
                const account = accounts.find(a => a.id === contribution.accountId)
                const asset = assets.find(a => a.id === contribution.assetId)

                if (!account) throw new Error("Account not found")
                if (!asset) throw new Error("Asset not found")
                if (contribution.amount <= 0) throw new Error("Amount must be greater than 0")
                if (account.balance < contribution.amount) {
                    throw new Error("Insufficient funds in selected account")
                }

                const batch = writeBatch(db)
                const newTransRef = doc(collection(db, 'transactions'))

                batch.set(newTransRef, {
                    amount: contribution.amount,
                    type: 'savings',
                    category: 'Asset Contribution',
                    description: contribution.description || `Contribution to ${asset.name}`,
                    date: contribution.date,
                    userId,
                    accountId: contribution.accountId,
                    assetId: contribution.assetId,
                    createdAt: Timestamp.now()
                })

                batch.update(doc(db, 'accounts', contribution.accountId), {
                    balance: increment(-contribution.amount)
                })
                batch.update(doc(db, 'assets', contribution.assetId), {
                    currentValue: increment(contribution.amount)
                })

                await batch.commit()
            },
            subscribeToAssets: (userId) => {
                const q = query(collection(db, 'assets'), where("userId", "==", userId))
                return onSnapshot(q, (snapshot) => {
                    const assets = snapshot.docs.map(docSnapshot => ({
                        id: docSnapshot.id,
                        ...docSnapshot.data()
                    } as Asset))
                    set({ assets })
                }, (error) => { console.error("Error subscribing to assets:", error) })
            },

            // Recurring Transactions Implementation
            addRecurringTransaction: async (data, userId) => {
                try {
                    await addDoc(collection(db, 'recurring_transactions'), {
                        ...data,
                        userId,
                        createdAt: Timestamp.now()
                    })
                } catch (e) {
                    console.error("Error adding recurring:", e)
                    notifyError(`Failed to add recurring transaction: ${(e as Error).message}`)
                }
            },

            editRecurringTransaction: async (id, updates) => {
                try {
                    await updateDoc(doc(db, 'recurring_transactions', id), updates)
                } catch (e) {
                    console.error("Error editing recurring:", e)
                    notifyError(`Failed to update recurring transaction: ${(e as Error).message}`)
                }
            },

            deleteRecurringTransaction: async (id) => {
                try {
                    await deleteDoc(doc(db, 'recurring_transactions', id))
                } catch (e) {
                    console.error("Error deleting recurring:", e)
                    notifyError(`Failed to delete recurring transaction: ${(e as Error).message}`)
                }
            },

            subscribeToRecurringTransactions: (userId) => {
                const q = query(
                    collection(db, 'recurring_transactions'),
                    where('userId', '==', userId)
                )
                return onSnapshot(q, (snapshot) => {
                    const recurring = snapshot.docs.map(doc => {
                        const data = doc.data()
                        return {
                            id: doc.id,
                            ...data,
                            category: data.type === 'income' && data.category === 'Investments'
                                ? 'Investment Income'
                                : data.category
                        } as RecurringTransaction
                    })
                    set({ recurringTransactions: recurring })

                    const legacyInvestmentRecurring = snapshot.docs.filter(
                        docSnapshot => {
                            const data = docSnapshot.data()
                            return data.type === 'income' && data.category === 'Investments'
                        }
                    )

                    if (legacyInvestmentRecurring.length > 0 && !isMigratingInvestmentRecurring) {
                        isMigratingInvestmentRecurring = true
                        const batch = writeBatch(db)
                        legacyInvestmentRecurring.forEach(docSnapshot => {
                            batch.update(docSnapshot.ref, { category: 'Investment Income' })
                        })
                        batch.commit()
                            .catch(error => console.error("Error renaming investment recurring category:", error))
                            .finally(() => { isMigratingInvestmentRecurring = false })
                    }

                    // Check for due transactions whenever the list updates or on load
                    get().processRecurringTransactions(userId)
                }, (error) => {
                    console.error("Error subscribing to recurring transactions:", error)
                })
            },

            processRecurringTransactions: async (userId) => {
                if (isProcessingRecurring) return
                isProcessingRecurring = true

                try {
                    const now = new Date()
                    const due = get().recurringTransactions.filter(rt => rt.active && new Date(rt.nextRunDate) <= now)
                    if (due.length === 0) return

                    for (const rt of due) {
                        try {
                            await runTransaction(db, async (transaction) => {
                                const rtRef = doc(db, 'recurring_transactions', rt.id)
                                const rtSnap = await transaction.get(rtRef)
                                if (!rtSnap.exists()) return

                                const data = rtSnap.data() as RecurringTransaction
                                if (!data.active) return

                                let nextRun = new Date(data.nextRunDate)
                                if (nextRun > new Date()) return
                                if (data.amount <= 0) {
                                    transaction.update(rtRef, { active: false })
                                    return
                                }
                                if (!data.accountId) {
                                    transaction.update(rtRef, { active: false })
                                    return
                                }
                                if (data.linkType && !data.linkId) {
                                    transaction.update(rtRef, { active: false })
                                    return
                                }

                                const accountRef = data.accountId ? doc(db, 'accounts', data.accountId) : null
                                const accountSnap = accountRef ? await transaction.get(accountRef) : null

                                const linkCollection = data.linkType === 'debt'
                                    ? 'debts'
                                    : data.linkType === 'asset'
                                        ? 'assets'
                                        : data.linkType === 'goal'
                                            ? 'goals'
                                            : null
                                const linkRef = linkCollection && data.linkId
                                    ? doc(db, linkCollection, data.linkId)
                                    : null
                                const linkSnap = linkRef ? await transaction.get(linkRef) : null
                                const linkedData = linkSnap?.exists()
                                    ? linkSnap.data()
                                    : null

                                if (data.linkType && data.linkId && !linkedData) {
                                    transaction.update(rtRef, { active: false })
                                    return
                                }

                                let linkRemaining = data.linkType === 'debt' && linkedData
                                    ? Number(linkedData.remainingAmount) || 0
                                    : data.linkType === 'goal' && linkedData
                                        ? Math.max(0, (Number(linkedData.targetAmount) || 0) - (Number(linkedData.currentAmount) || 0))
                                        : 0
                                let linkTotalAmount = 0
                                const linkInterestRate = data.linkType === 'debt' && linkedData
                                    ? Number(linkedData.interestRate) || 0
                                    : 0

                                let balanceDelta = 0
                                let lastProcessed = data.nextRunDate
                                let occurrences = 0
                                let exhausted = false
                                const MAX_CATCH_UP = 400
                                const cutoff = new Date()

                                while (nextRun <= cutoff && occurrences < MAX_CATCH_UP) {
                                    const transactionData: Record<string, unknown> = {
                                        amount: data.amount,
                                        type: data.type,
                                        category: data.category,
                                        description: `Recurring: ${data.name}`,
                                        date: nextRun.toISOString(),
                                        userId: data.userId || userId,
                                        accountId: data.accountId,
                                        createdAt: Timestamp.now()
                                    }

                                    if (data.linkType === 'asset' || data.linkType === 'goal') {
                                        transactionData.type = 'savings'
                                        transactionData.category = data.linkType === 'asset'
                                            ? 'Asset Contribution'
                                            : 'Goal Contribution'
                                    } else if (data.linkType === 'debt') {
                                        transactionData.type = 'expense'
                                        transactionData.category = data.category || 'Debt Payment'
                                    }

                                    if (data.linkType === 'debt' && data.linkId && linkedData) {
                                        if (linkRemaining <= 0) {
                                            exhausted = true
                                            break
                                        }

                                        const payment = Math.min(
                                            data.amount,
                                            estimatePayoffAmount(linkRemaining, linkInterestRate)
                                        )
                                        const split = splitDebtPayment(payment, linkRemaining, linkInterestRate)
                                        transactionData.amount = payment
                                        transactionData.debtId = data.linkId
                                        transactionData.interestAmount = split.interestAmount
                                        transactionData.principalAmount = split.principalAmount

                                        linkRemaining = Math.max(0, linkRemaining - split.principalAmount)
                                    } else if (data.linkType === 'goal' && data.linkId && linkedData) {
                                        if (linkRemaining <= 0) {
                                            exhausted = true
                                            break
                                        }

                                        const contribution = Math.min(data.amount, linkRemaining)
                                        transactionData.amount = contribution
                                        transactionData.goalId = data.linkId

                                        linkRemaining -= contribution
                                        linkTotalAmount += contribution
                                    } else if (data.linkType === 'asset' && data.linkId && linkedData) {
                                        transactionData.assetId = data.linkId
                                        linkTotalAmount += data.amount
                                    }

                                    const newTransRef = doc(collection(db, 'transactions'))
                                    transaction.set(newTransRef, transactionData)

                                    const postedAmount = Number(transactionData.amount)
                                    balanceDelta += transactionData.type === 'income' ? postedAmount : -postedAmount
                                    lastProcessed = nextRun.toISOString()
                                    nextRun = getNextRunDate(nextRun, data.frequency)
                                    occurrences++

                                    if (data.linkType && linkRemaining <= 0 && (data.linkType === 'debt' || data.linkType === 'goal')) {
                                        exhausted = true
                                        break
                                    }
                                }

                                if (occurrences === 0) {
                                    if (exhausted) {
                                        transaction.update(rtRef, {
                                            active: false,
                                            lastRunDate: lastProcessed
                                        })
                                    }
                                    return
                                }

                                if (accountRef && accountSnap?.exists() && balanceDelta !== 0) {
                                    transaction.update(accountRef, { balance: increment(balanceDelta) })
                                }

                                if (linkRef && linkedData && data.linkType === 'debt') {
                                    transaction.update(linkRef, {
                                        remainingAmount: Math.max(0, linkRemaining),
                                        status: linkRemaining <= 0 ? 'paid' : 'active'
                                    })
                                } else if (linkRef && linkedData && data.linkType === 'goal') {
                                    transaction.update(linkRef, {
                                        currentAmount: increment(linkTotalAmount)
                                    })
                                } else if (linkRef && linkedData && data.linkType === 'asset') {
                                    transaction.update(linkRef, {
                                        currentValue: increment(linkTotalAmount)
                                    })
                                }

                                transaction.update(rtRef, {
                                    lastRunDate: lastProcessed,
                                    nextRunDate: nextRun.toISOString(),
                                    ...(exhausted ? { active: false } : {})
                                })
                            })
                        } catch (e) {
                            console.error("Error processing recurring transaction:", e)
                        }
                    }
                } finally {
                    isProcessingRecurring = false
                }
            },

            subscribeToTransactions: (userId) => {
                set({ loading: true })
                const q = query(
                    collection(db, 'transactions'),
                    where("userId", "==", userId),
                    orderBy("date", "desc")
                )
                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const transactions: Transaction[] = []
                    querySnapshot.forEach((doc) => {
                        const data = doc.data()
                        const isLegacyGoalContribution =
                            data.type === 'expense' &&
                            (data.goalId || data.category === 'Navigasi / Financial Goal')
                        const isLegacyInvestmentIncome =
                            data.type === 'income' &&
                            data.category === 'Investments'

                        transactions.push({
                            id: doc.id,
                            amount: data.amount,
                            type: isLegacyGoalContribution ? 'savings' : data.type,
                            category: isLegacyInvestmentIncome ? 'Investment Income' : data.category,
                            description: data.description,
                            date: data.date,
                            userId: data.userId,
                            accountId: data.accountId || "", // Handle legacy
                            toAccountId: data.toAccountId,
                            goalId: data.goalId,
                            debtId: data.debtId,
                            assetId: data.assetId,
                            interestAmount: data.interestAmount,
                            principalAmount: data.principalAmount
                        })
                    })

                    const legacyGoalContributions = querySnapshot.docs.filter((docSnapshot) => {
                        const data = docSnapshot.data()
                        return data.type === 'expense' &&
                            (data.goalId || data.category === 'Navigasi / Financial Goal')
                    })

                    if (legacyGoalContributions.length > 0 && !isMigratingLegacyGoalContributions) {
                        isMigratingLegacyGoalContributions = true

                        const migrate = async () => {
                            for (let index = 0; index < legacyGoalContributions.length; index += 450) {
                                const batch = writeBatch(db)
                                legacyGoalContributions.slice(index, index + 450).forEach((docSnapshot) => {
                                    batch.update(docSnapshot.ref, { type: 'savings' })
                                })
                                await batch.commit()
                            }
                        }

                        migrate()
                            .catch((error) => console.error("Error migrating goal contributions:", error))
                            .finally(() => {
                                isMigratingLegacyGoalContributions = false
                            })
                    }

                    const legacyInvestmentTransactions = querySnapshot.docs.filter((docSnapshot) => {
                        const data = docSnapshot.data()
                        return data.type === 'income' && data.category === 'Investments'
                    })

                    if (legacyInvestmentTransactions.length > 0 && !isMigratingInvestmentTransactions) {
                        isMigratingInvestmentTransactions = true

                        const migrate = async () => {
                            for (let index = 0; index < legacyInvestmentTransactions.length; index += 450) {
                                const batch = writeBatch(db)
                                legacyInvestmentTransactions.slice(index, index + 450).forEach((docSnapshot) => {
                                    batch.update(docSnapshot.ref, { category: 'Investment Income' })
                                })
                                await batch.commit()
                            }
                        }

                        migrate()
                            .catch((error) => console.error("Error renaming investment transactions:", error))
                            .finally(() => {
                                isMigratingInvestmentTransactions = false
                            })
                    }

                    set({ transactions, loading: false })
                }, (error) => {
                    console.error("Error fetching transactions: ", error)
                    set({ loading: false })
                })
                return unsubscribe
            },

            subscribeToCategories: (userId) => {
                const q = query(collection(db, 'categories'), where("userId", "==", userId))
                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const categories: Category[] = []
                    querySnapshot.forEach((doc) => {
                        const data = doc.data()
                        categories.push({
                            id: doc.id,
                            ...data,
                            group: data.group ?? getDefaultCategoryGroup(data.name, data.type)
                        } as Category)
                    })
                    set({ categories })

                    if (!isMigratingInvestmentLabels) {
                        const hasNewLabel = categories.some(
                            category => category.type === 'income' && category.name === 'Investment Income'
                        )
                        const legacyCategories = categories.filter(
                            category => category.type === 'income' && category.name === 'Investments'
                        )

                        if (legacyCategories.length > 0 && !hasNewLabel) {
                            isMigratingInvestmentLabels = true
                            const batch = writeBatch(db)
                            legacyCategories.forEach(category => {
                                batch.update(doc(db, 'categories', category.id), { name: 'Investment Income' })
                            })
                            batch.commit()
                                .catch(error => console.error("Error renaming investment category:", error))
                                .finally(() => { isMigratingInvestmentLabels = false })
                        }
                    }
                }, (error) => { console.error("Error fetching categories: ", error) })
                return unsubscribe
            },

            subscribeToBudgets: (userId) => {
                const q = query(collection(db, 'budgets'), where("userId", "==", userId))
                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const budgets: Budget[] = []
                    querySnapshot.forEach((doc) => {
                        budgets.push({ id: doc.id, ...doc.data() } as Budget)
                    })
                    set({ budgets })
                }, (error) => { console.error("Error fetching budgets: ", error) })
                return unsubscribe
            },

            subscribeToAccounts: (userId) => {
                const q = query(collection(db, 'accounts'), where("userId", "==", userId))
                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const allAccounts: Account[] = []
                    querySnapshot.forEach((docSnapshot) => {
                        allAccounts.push({ id: docSnapshot.id, ...docSnapshot.data() } as Account)
                    })

                    const legacyAccounts = allAccounts.filter(account =>
                        isLegacyAssetAccountType(account.type)
                    )
                    const accounts = allAccounts.filter(account =>
                        !isLegacyAssetAccountType(account.type)
                    )

                    set({ accounts })

                    if (legacyAccounts.length > 0) {
                        migrateLegacyAssetAccounts(legacyAccounts, userId, (migratedAssets) => {
                            const migratedIds = new Set(migratedAssets.map(asset => asset.id))
                            set(state => ({
                                assets: [
                                    ...state.assets.filter(asset => !migratedIds.has(asset.id)),
                                    ...migratedAssets
                                ]
                            }))
                        }).then((migrated) => {
                            if (!migrated) {
                                set({ accounts: allAccounts })
                            }
                        })
                    }
                }, (error) => { console.error("Error fetching accounts: ", error) })
                return unsubscribe
            },

            // Goals Implementation
            addGoal: async (goal, userId) => {
                try {
                    await addDoc(collection(db, 'goals'), {
                        ...goal,
                        userId,
                        createdAt: Timestamp.now()
                    })
                } catch (e) {
                    console.error("Error adding goal:", e)
                    notifyError(`Failed to add goal: ${(e as Error).message}`)
                }
            },

            editGoal: async (id, updates) => {
                try {
                    await updateDoc(doc(db, 'goals', id), updates)
                } catch (e) {
                    console.error("Error editing goal:", e)
                    notifyError(`Failed to update goal: ${(e as Error).message}`)
                }
            },

            deleteGoal: async (id) => {
                try {
                    await deleteDoc(doc(db, 'goals', id))
                } catch (e) {
                    console.error("Error deleting goal:", e)
                    notifyError(`Failed to delete goal: ${(e as Error).message}`)
                }
            },

            contributeToGoal: async (goalId, accountId, amount, userId) => {
                try {
                    const { accounts, goals } = get()
                    const account = accounts.find(a => a.id === accountId)
                    const goal = goals.find(g => g.id === goalId)

                    if (!account) throw new Error("Account not found")
                    if (!goal) throw new Error("Goal not found")
                    if (amount <= 0) throw new Error("Amount must be greater than 0")
                    if (amount > Math.max(0, goal.targetAmount - goal.currentAmount)) {
                        throw new Error("Contribution exceeds the remaining goal amount")
                    }
                    if (account.balance < amount) throw new Error("Insufficient funds")

                    const batch = writeBatch(db)

                    // 1. Create Savings Transaction
                    const newTransRef = doc(collection(db, 'transactions'))
                    batch.set(newTransRef, {
                        amount,
                        type: 'savings',
                        category: 'Goal Contribution',
                        description: `Contribution to ${goal.name}`,
                        date: new Date().toISOString(),
                        userId,
                        accountId,
                        goalId,
                        createdAt: Timestamp.now()
                    })

                    // 2. Deduct from Account
                    const accountRef = doc(db, 'accounts', accountId)
                    batch.update(accountRef, { balance: increment(-amount) })

                    // 3. Add to Goal
                    const goalRef = doc(db, 'goals', goalId)
                    batch.update(goalRef, { currentAmount: increment(amount) })

                    await batch.commit()

                } catch (e) {
                    console.error("Error contributing to goal:", e)
                    notifyError((e as Error).message)
                }
            },

            subscribeToGoals: (userId) => {
                const q = query(collection(db, 'goals'), where("userId", "==", userId))
                return onSnapshot(q, (snapshot) => {
                    const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialGoal))
                    set({ goals })
                }, (error) => { console.error("Error subscribing to goals:", error) })
            },

            // Debt Implementation
            addDebt: async (debt, userId) => {
                try {
                    await addDoc(collection(db, 'debts'), {
                        ...debt,
                        remainingAmount: debt.totalAmount,
                        status: 'active',
                        userId,
                        createdAt: Timestamp.now()
                    })
                } catch (e) {
                    console.error("Error adding debt:", e)
                    notifyError(`Failed to add debt: ${(e as Error).message}`)
                }
            },

            editDebt: async (id, updates) => {
                try {
                    await updateDoc(doc(db, 'debts', id), updates)
                } catch (e) {
                    console.error("Error editing debt:", e)
                    notifyError(`Failed to update debt: ${(e as Error).message}`)
                }
            },

            deleteDebt: async (id) => {
                try {
                    await deleteDoc(doc(db, 'debts', id))
                } catch (e) {
                    console.error("Error deleting debt:", e)
                    notifyError(`Failed to delete debt: ${(e as Error).message}`)
                }
            },

            payDebt: async (debtId, amount, accountId, userId) => {
                try {
                    const { accounts, debts } = get()
                    const account = accounts.find(a => a.id === accountId)
                    const debt = debts.find(d => d.id === debtId)

                    if (!account) throw new Error("Account not found")
                    if (!debt) throw new Error("Debt not found")

                    // Validation
                    if (debt.type === 'payable' && account.balance < amount) {
                        // If paying debt (expense), check balance
                        throw new Error("Insufficient funds to pay debt")
                    }
                    const maxPayment = debt.type === 'payable'
                        ? estimatePayoffAmount(debt.remainingAmount, debt.interestRate)
                        : debt.remainingAmount
                    if (amount > maxPayment) {
                        throw new Error("Payment amount exceeds the maximum allowed")
                    }

                    const batch = writeBatch(db)

                    // 1. Create Transaction
                    const newTransRef = doc(collection(db, 'transactions'))
                    const isPayable = debt.type === 'payable' // Hutang (Expense)
                    const split = isPayable && debt.interestRate && debt.interestRate > 0
                        ? splitDebtPayment(amount, debt.remainingAmount, debt.interestRate)
                        : null

                    batch.set(newTransRef, {
                        amount,
                        type: isPayable ? 'expense' : 'income',
                        category: isPayable ? 'Debt Payment' : 'Debt Collection',
                        description: `${isPayable ? 'Paid to' : 'Received from'} ${debt.personName}`,
                        date: new Date().toISOString(),
                        userId,
                        accountId,
                        debtId,
                        ...(split
                            ? {
                                interestAmount: split.interestAmount,
                                principalAmount: split.principalAmount
                            }
                            : {}),
                        createdAt: Timestamp.now()
                    })

                    // 2. Update Account
                    const accountRef = doc(db, 'accounts', accountId)
                    batch.update(accountRef, { balance: increment(isPayable ? -amount : amount) })

                    // 3. Update Debt (only principal reduces the balance)
                    const debtRef = doc(db, 'debts', debtId)
                    const principalReduction = split ? split.principalAmount : amount
                    const newRemaining = debt.remainingAmount - principalReduction
                    batch.update(debtRef, {
                        remainingAmount: increment(-principalReduction),
                        status: newRemaining <= 0 ? 'paid' : 'active'
                    })

                    await batch.commit()

                } catch (e) {
                    console.error("Error paying debt:", e)
                    notifyError((e as Error).message)
                }
            },

            subscribeToDebts: (userId) => {
                const q = query(collection(db, 'debts'), where("userId", "==", userId))
                return onSnapshot(q, (snapshot) => {
                    const debts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt))
                    set({ debts })
                }, (error) => { console.error("Error subscribing to debts:", error) })
            },

            saveHealthSnapshot: async (snapshot, userId) => {
                try {
                    await setDoc(doc(db, 'health_snapshots', `${userId}_${snapshot.month}`), {
                        ...snapshot,
                        userId,
                        updatedAt: Timestamp.now()
                    }, { merge: true })
                } catch (error) {
                    console.error("Error saving health snapshot:", error)
                }
            },

            subscribeToHealthSnapshots: (userId) => {
                const q = query(collection(db, 'health_snapshots'), where("userId", "==", userId))
                return onSnapshot(q, (snapshot) => {
                    const healthSnapshots = snapshot.docs
                        .map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() } as HealthSnapshot))
                        .sort((a, b) => a.month.localeCompare(b.month))
                    set({ healthSnapshots })
                }, (error) => { console.error("Error subscribing to health snapshots:", error) })
            },

            importBackup: async (backup, userId) => {
                const healthSnapshots = (backup.healthSnapshots ?? []).map(snapshot => ({
                    ...snapshot,
                    id: `${userId}_${snapshot.month}`
                }))

                const entries = [
                    ['accounts', backup.accounts],
                    ['assets', backup.assets ?? []],
                    ['transactions', backup.transactions],
                    ['categories', backup.categories],
                    ['budgets', backup.budgets],
                    ['recurring_transactions', backup.recurringTransactions],
                    ['goals', backup.goals],
                    ['debts', backup.debts],
                    ['health_snapshots', healthSnapshots],
                ] as const

                const writes: Array<{ path: string; id: string; data: Record<string, unknown> }> = []

                for (const [collectionName, items] of entries) {
                    for (const item of items) {
                        const { id, ...rest } = item
                        writes.push({
                            path: collectionName,
                            id,
                            data: { ...rest, userId }
                        })
                    }
                }

                for (let index = 0; index < writes.length; index += 450) {
                    const batch = writeBatch(db)
                    writes.slice(index, index + 450).forEach(({ path, id, data }) => {
                        batch.set(doc(db, path, id), data)
                    })
                    await batch.commit()
                }

                set((state) => ({
                    currency: backup.currency,
                    financialTargets: backup.financialTargets ?? state.financialTargets
                }))
            },

            resetData: async (userId) => {
                try {
                    const collections = [
                        'transactions',
                        'budgets',
                        'accounts',
                        'assets',
                        'recurring_transactions',
                        'goals',
                        'debts',
                        'health_snapshots'
                    ]

                    for (const collectionName of collections) {
                        await deleteUserDocuments(collectionName, userId)
                    }
                } catch (e) {
                    console.error("Error resetting data:", e)
                    throw e
                }
            },

            deleteAccountData: async (userId) => {
                const collections = [
                    'transactions',
                    'categories',
                    'budgets',
                    'accounts',
                    'assets',
                    'recurring_transactions',
                    'goals',
                    'debts',
                    'health_snapshots'
                ]

                for (const collectionName of collections) {
                    await deleteUserDocuments(collectionName, userId)
                }
            }
        }),
        {
            name: 'ledger-settings',
            partialize: (state) => ({
                currency: state.currency,
                financialTargets: state.financialTargets
            }),
        }
    )
)
