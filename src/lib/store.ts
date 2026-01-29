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
    writeBatch
} from 'firebase/firestore'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, ACCOUNT_TYPES } from './constants'

export type TransactionType = 'income' | 'expense'

export interface Account {
    id: string
    userId: string
    name: string
    type: typeof ACCOUNT_TYPES[number]
    balance: number
    color?: string
}

export interface Transaction {
    id: string
    amount: number
    type: TransactionType
    category: string
    description?: string
    date: string
    userId: string
    accountId: string
}

export type TransactionFormValues = Omit<Transaction, 'id' | 'userId'>

export interface Category {
    id: string
    name: string
    type: TransactionType
    userId: string
    isDefault?: boolean
}

export interface Budget {
    id: string
    category: string
    amount: number
    userId: string
}

export interface RecurringTransaction {
    id: string
    userId: string
    name: string
    amount: number
    type: TransactionType
    category: string
    accountId: string
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    startDate: string // ISO string
    nextRunDate: string // ISO string
    active: boolean
    lastRunDate?: string
}

export interface FinancialGoal {
    id: string
    userId: string
    name: string
    targetAmount: number
    currentAmount: number
    deadline?: string
    color?: string
}

export interface Debt {
    id: string
    userId: string
    type: 'payable' | 'receivable'
    personName: string
    totalAmount: number
    remainingAmount: number
    dueDate?: string // ISO string
    description?: string
    status: 'active' | 'paid'
    createdAt: any
}

interface TransactionState {
    transactions: Transaction[]
    categories: Category[]
    budgets: Budget[]
    accounts: Account[]
    recurringTransactions: RecurringTransaction[]
    goals: FinancialGoal[]
    debts: Debt[]
    currency: 'IDR' | 'USD'
    loading: boolean
    setCurrency: (currency: 'IDR' | 'USD') => void

    // Async Actions
    addTransaction: (transaction: TransactionFormValues, userId: string) => Promise<void>
    removeTransaction: (id: string) => Promise<void>
    editTransaction: (id: string, updates: Partial<TransactionFormValues>) => Promise<void>

    addCategory: (category: Omit<Category, 'id' | 'userId'>, userId: string) => Promise<void>
    removeCategory: (id: string) => Promise<void>
    seedDefaults: (userId: string) => Promise<void>

    addBudget: (budget: Omit<Budget, 'id' | 'userId'>, userId: string) => Promise<void>
    removeBudget: (id: string) => Promise<void>

    addAccount: (account: Omit<Account, 'id' | 'userId'>, userId: string) => Promise<void>
    removeAccount: (id: string) => Promise<void>
    editAccount: (id: string, updates: Partial<Omit<Account, 'id' | 'userId'>>) => Promise<void>

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

    // Reset Data
    resetData: (userId: string) => Promise<void>
}

export const useTransactionStore = create<TransactionState>()(
    persist(
        (set, get) => ({
            transactions: [],
            categories: [],
            budgets: [],
            accounts: [],
            recurringTransactions: [],
            goals: [],
            debts: [],
            currency: 'IDR',
            loading: false,

            setCurrency: (currency) => set({ currency }),

            addTransaction: async (formData, userId) => {
                try {
                    const batch = writeBatch(db)

                    // 1. Transaction
                    const newTransRef = doc(collection(db, 'transactions'))
                    batch.set(newTransRef, {
                        ...formData,
                        userId,
                        createdAt: Timestamp.now()
                    })

                    // 2. Account Balance
                    if (formData.accountId) {
                        const accountRef = doc(db, 'accounts', formData.accountId)
                        const accountSnap = await getDoc(accountRef)

                        if (accountSnap.exists()) {
                            const currentBalance = accountSnap.data().balance || 0
                            let newBalance = currentBalance
                            if (formData.type === 'income') {
                                newBalance += formData.amount
                            } else {
                                newBalance -= formData.amount
                            }
                            batch.update(accountRef, { balance: newBalance })
                        }
                    }

                    await batch.commit()
                } catch (error) {
                    console.error("Error adding transaction: ", error)
                    alert(`Failed to save transaction: ${(error as Error).message}`)
                }
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
                            const currentBalance = accountSnap.data().balance || 0
                            let newBalance = currentBalance
                            // Revert logic
                            if (trans.type === 'income') {
                                newBalance -= trans.amount
                            } else {
                                newBalance += trans.amount
                            }
                            batch.update(accountRef, { balance: newBalance })
                        }
                    }
                    await batch.commit()
                } catch (error) {
                    console.error("Error deleting transaction: ", error)
                }
            },

            editTransaction: async (id, updates) => {
                try {
                    const oldTrans = get().transactions.find(t => t.id === id)
                    if (!oldTrans) return

                    const batch = writeBatch(db)
                    const transRef = doc(db, 'transactions', id)
                    batch.update(transRef, updates)

                    const newTrans = { ...oldTrans, ...updates }

                    const impactChanged =
                        oldTrans.amount !== newTrans.amount ||
                        oldTrans.type !== newTrans.type ||
                        oldTrans.accountId !== newTrans.accountId

                    if (impactChanged) {
                        const accountsToUpdate = new Map<string, number>()

                        // Get old account data
                        if (oldTrans.accountId) {
                            const oldAccRef = doc(db, 'accounts', oldTrans.accountId)
                            const oldAccSnap = await getDoc(oldAccRef)
                            if (oldAccSnap.exists()) {
                                accountsToUpdate.set(oldTrans.accountId, oldAccSnap.data().balance)
                            }
                        }

                        // Get new account data if different and not already fetched
                        if (newTrans.accountId && newTrans.accountId !== oldTrans.accountId) {
                            if (!accountsToUpdate.has(newTrans.accountId)) {
                                const newAccRef = doc(db, 'accounts', newTrans.accountId)
                                const newAccSnap = await getDoc(newAccRef)
                                if (newAccSnap.exists()) {
                                    accountsToUpdate.set(newTrans.accountId, newAccSnap.data().balance)
                                }
                            }
                        }

                        // Revert Old
                        if (oldTrans.accountId && accountsToUpdate.has(oldTrans.accountId)) {
                            let bal = accountsToUpdate.get(oldTrans.accountId)!
                            if (oldTrans.type === 'income') bal -= oldTrans.amount
                            else bal += oldTrans.amount
                            accountsToUpdate.set(oldTrans.accountId, bal)
                        }

                        // Apply New
                        if (newTrans.accountId && accountsToUpdate.has(newTrans.accountId)) {
                            let bal = accountsToUpdate.get(newTrans.accountId)!
                            if (newTrans.type === 'income') bal += newTrans.amount
                            else bal -= newTrans.amount
                            accountsToUpdate.set(newTrans.accountId, bal)
                        }

                        // Update Batch
                        for (const [accId, bal] of accountsToUpdate.entries()) {
                            batch.update(doc(db, 'accounts', accId), { balance: bal })
                        }
                    }
                    await batch.commit()
                } catch (error) {
                    console.error("Error updating transaction: ", error)
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
                    alert(`Failed to add category: ${(error as Error).message}`)
                }
            },

            seedDefaults: async (userId) => {
                const { addCategory } = get()
                for (const cat of INCOME_CATEGORIES) {
                    await addCategory({ name: cat, type: 'income' }, userId)
                }
                for (const cat of EXPENSE_CATEGORIES) {
                    await addCategory({ name: cat, type: 'expense' }, userId)
                }
            },

            removeCategory: async (id) => {
                try {
                    await deleteDoc(doc(db, 'categories', id))
                } catch (error) {
                    console.error("Error removing category: ", error)
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
                    alert(`Failed to save budget: ${(error as Error).message}`)
                }
            },

            removeBudget: async (id) => {
                try {
                    await deleteDoc(doc(db, 'budgets', id))
                } catch (error) {
                    console.error("Error removing budget: ", error)
                }
            },

            addAccount: async (account, userId) => {
                try {
                    await addDoc(collection(db, 'accounts'), {
                        ...account,
                        userId,
                        createdAt: Timestamp.now()
                    })
                } catch (e) { console.error("Error accounting:", e) }
            },
            removeAccount: async (id) => {
                try {
                    await deleteDoc(doc(db, 'accounts', id))
                } catch (e) { console.error(e) }
            },
            editAccount: async (id, updates) => {
                try {
                    await updateDoc(doc(db, 'accounts', id), updates)
                } catch (e) { console.error(e) }
            },

            // Recurring Transactions Implementation
            addRecurringTransaction: async (data, userId) => {
                try {
                    await addDoc(collection(db, 'recurring_transactions'), {
                        ...data,
                        userId,
                        createdAt: Timestamp.now()
                    })
                } catch (e) { console.error("Error adding recurring:", e) }
            },

            editRecurringTransaction: async (id, updates) => {
                try {
                    await updateDoc(doc(db, 'recurring_transactions', id), updates)
                } catch (e) { console.error("Error editing recurring:", e) }
            },

            deleteRecurringTransaction: async (id) => {
                try {
                    await deleteDoc(doc(db, 'recurring_transactions', id))
                } catch (e) { console.error("Error deleting recurring:", e) }
            },

            subscribeToRecurringTransactions: (userId) => {
                const q = query(
                    collection(db, 'recurring_transactions'),
                    where('userId', '==', userId)
                )
                return onSnapshot(q, (snapshot) => {
                    const recurring = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecurringTransaction))
                    set({ recurringTransactions: recurring })

                    // Check for due transactions whenever the list updates or on load
                    get().processRecurringTransactions(userId)
                }, (error) => {
                    console.error("Error subscribing to recurring transactions:", error)
                })
            },

            processRecurringTransactions: async (userId) => {
                const { recurringTransactions, accounts } = get()
                const now = new Date()
                const due = recurringTransactions.filter(rt => rt.active && new Date(rt.nextRunDate) <= now)

                if (due.length === 0) return

                const batch = writeBatch(db)
                let hasUpdates = false

                due.forEach(rt => {
                    // 1. Create Transaction
                    const newTransRef = doc(collection(db, 'transactions'))
                    const transactionData = {
                        amount: rt.amount,
                        type: rt.type,
                        category: rt.category,
                        description: `Recurring: ${rt.name}`,
                        date: rt.nextRunDate, // Use the scheduled date
                        userId,
                        accountId: rt.accountId,
                        createdAt: Timestamp.now()
                    }
                    batch.set(newTransRef, transactionData)

                    // 2. Update Account Balance
                    const account = accounts.find(a => a.id === rt.accountId)
                    if (account) {
                        const accountRef = doc(db, 'accounts', rt.accountId)
                        let newBalance = account.balance
                        if (rt.type === 'income') newBalance += rt.amount
                        else newBalance -= rt.amount
                        batch.update(accountRef, { balance: newBalance })
                    }

                    // 3. Update Next Run Date
                    const nextDate = new Date(rt.nextRunDate)
                    switch (rt.frequency) {
                        case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
                        case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
                        case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
                        case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
                    }

                    const rtRef = doc(db, 'recurring_transactions', rt.id)
                    batch.update(rtRef, {
                        lastRunDate: rt.nextRunDate,
                        nextRunDate: nextDate.toISOString()
                    })
                    hasUpdates = true
                })

                if (hasUpdates) {
                    try {
                        await batch.commit()
                        console.log(`Processed ${due.length} recurring transactions`)
                    } catch (e) {
                        console.error("Error processing recurring:", e)
                    }
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
                        transactions.push({
                            id: doc.id,
                            amount: data.amount,
                            type: data.type,
                            category: data.category,
                            description: data.description,
                            date: data.date,
                            userId: data.userId,
                            accountId: data.accountId || "" // Handle legacy
                        })
                    })
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
                        categories.push({ id: doc.id, ...doc.data() } as Category)
                    })
                    set({ categories })
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
                    const accounts: Account[] = []
                    querySnapshot.forEach((doc) => {
                        accounts.push({ id: doc.id, ...doc.data() } as Account)
                    })
                    set({ accounts })
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
                } catch (e) { console.error("Error adding goal:", e) }
            },

            editGoal: async (id, updates) => {
                try {
                    await updateDoc(doc(db, 'goals', id), updates)
                } catch (e) { console.error("Error editing goal:", e) }
            },

            deleteGoal: async (id) => {
                try {
                    await deleteDoc(doc(db, 'goals', id))
                } catch (e) { console.error("Error deleting goal:", e) }
            },

            contributeToGoal: async (goalId, accountId, amount, userId) => {
                try {
                    const { accounts, goals } = get()
                    const account = accounts.find(a => a.id === accountId)
                    const goal = goals.find(g => g.id === goalId)

                    if (!account) throw new Error("Account not found")
                    if (!goal) throw new Error("Goal not found")
                    if (account.balance < amount) throw new Error("Insufficient funds")

                    const batch = writeBatch(db)

                    // 1. Create Transaction (Expense)
                    const newTransRef = doc(collection(db, 'transactions'))
                    batch.set(newTransRef, {
                        amount,
                        type: 'expense',
                        category: 'Navigasi / Financial Goal', // Special category
                        description: `Contribution to ${goal.name}`,
                        date: new Date().toISOString(),
                        userId,
                        accountId,
                        createdAt: Timestamp.now()
                    })

                    // 2. Deduct from Account
                    const accountRef = doc(db, 'accounts', accountId)
                    batch.update(accountRef, { balance: account.balance - amount })

                    // 3. Add to Goal
                    const goalRef = doc(db, 'goals', goalId)
                    batch.update(goalRef, { currentAmount: goal.currentAmount + amount })

                    await batch.commit()

                } catch (e) {
                    console.error("Error contributing to goal:", e)
                    alert((e as Error).message)
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
                } catch (e) { console.error("Error adding debt:", e) }
            },

            editDebt: async (id, updates) => {
                try {
                    await updateDoc(doc(db, 'debts', id), updates)
                } catch (e) { console.error("Error editing debt:", e) }
            },

            deleteDebt: async (id) => {
                try {
                    await deleteDoc(doc(db, 'debts', id))
                } catch (e) { console.error("Error deleting debt:", e) }
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
                    if (amount > debt.remainingAmount) {
                        throw new Error("Payment amount exceeds remaining debt")
                    }

                    const batch = writeBatch(db)

                    // 1. Create Transaction
                    const newTransRef = doc(collection(db, 'transactions'))
                    const isPayable = debt.type === 'payable' // Hutang (Expense)

                    batch.set(newTransRef, {
                        amount,
                        type: isPayable ? 'expense' : 'income',
                        category: isPayable ? 'Debt Payment' : 'Debt Collection',
                        description: `${isPayable ? 'Paid to' : 'Received from'} ${debt.personName}`,
                        date: new Date().toISOString(),
                        userId,
                        accountId,
                        createdAt: Timestamp.now()
                    })

                    // 2. Update Account
                    const accountRef = doc(db, 'accounts', accountId)
                    let newBalance = account.balance
                    if (isPayable) newBalance -= amount
                    else newBalance += amount
                    batch.update(accountRef, { balance: newBalance })

                    // 3. Update Debt
                    const debtRef = doc(db, 'debts', debtId)
                    const newRemaining = debt.remainingAmount - amount
                    batch.update(debtRef, {
                        remainingAmount: newRemaining,
                        status: newRemaining <= 0 ? 'paid' : 'active'
                    })

                    await batch.commit()

                } catch (e) {
                    console.error("Error paying debt:", e)
                    alert((e as Error).message)
                }
            },

            subscribeToDebts: (userId) => {
                const q = query(collection(db, 'debts'), where("userId", "==", userId))
                return onSnapshot(q, (snapshot) => {
                    const debts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt))
                    set({ debts })
                }, (error) => { console.error("Error subscribing to debts:", error) })
            },

            resetData: async (userId) => {
                try {
                    const collections = [
                        'transactions',
                        'categories',
                        'budgets',
                        'accounts',
                        'recurring_transactions',
                        'goals',
                        'debts'
                    ]

                    for (const colName of collections) {
                        const q = query(collection(db, colName), where('userId', '==', userId))
                        const snapshot = await getDocs(q)

                        // Delete in batches of 500
                        const chunks = []
                        for (let i = 0; i < snapshot.docs.length; i += 500) {
                            chunks.push(snapshot.docs.slice(i, i + 500))
                        }

                        for (const chunk of chunks) {
                            const batch = writeBatch(db)
                            chunk.forEach(doc => {
                                batch.delete(doc.ref)
                            })
                            await batch.commit()
                        }
                    }
                } catch (e) {
                    console.error("Error resetting data:", e)
                    throw e
                }
            }
        }),
        {
            name: 'ledger-settings',
            partialize: (state) => ({ currency: state.currency }),
        }
    )
)
