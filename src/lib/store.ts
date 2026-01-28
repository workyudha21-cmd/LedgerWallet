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

interface TransactionState {
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
  accounts: Account[]
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

  // Real-time Subscription
  subscribeToTransactions: (userId: string) => () => void
  subscribeToCategories: (userId: string) => () => void
  subscribeToBudgets: (userId: string) => () => void
  subscribeToAccounts: (userId: string) => () => void
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      categories: [],
      budgets: [],
      accounts: [],
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
          } catch(e) { console.error(e) }
      },
      editAccount: async (id, updates) => {
          try {
              await updateDoc(doc(db, 'accounts', id), updates)
          } catch(e) { console.error(e) }
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
      }
    }),
    {
      name: 'ledger-settings',
      partialize: (state) => ({ currency: state.currency }),
    }
  )
)
