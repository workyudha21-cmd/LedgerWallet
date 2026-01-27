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
  Timestamp 
} from 'firebase/firestore'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from './constants'

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  category: string
  description?: string
  date: string
  userId: string
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
  
  // Real-time Subscription
  subscribeToTransactions: (userId: string) => () => void
  subscribeToCategories: (userId: string) => () => void
  subscribeToBudgets: (userId: string) => () => void
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      transactions: [],
      categories: [],
      budgets: [],
      currency: 'IDR',
      loading: false,

      setCurrency: (currency) => set({ currency }),

      addTransaction: async (formData, userId) => {
         try {
          await addDoc(collection(db, 'transactions'), {
            ...formData,
            userId,
            createdAt: Timestamp.now()
          })
        } catch (error: any) {
          console.error("Error adding transaction: ", error)
          alert(`Failed to save transaction: ${error.message}`)
        }
      },

      removeTransaction: async (id) => {
        try {
          await deleteDoc(doc(db, 'transactions', id))
        } catch (error) {
          console.error("Error deleting transaction: ", error)
        }
      },

      editTransaction: async (id, updates) => {
        try {
            const transactionRef = doc(db, 'transactions', id)
            await updateDoc(transactionRef, updates)
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
        } catch (error: any) {
            console.error("Error adding category: ", error)
            alert(`Failed to add category: ${error.message}`)
        }
      },

      seedDefaults: async (userId) => {
        const { addCategory } = get()
        // Add default incomes
        for (const cat of INCOME_CATEGORIES) {
            await addCategory({ name: cat, type: 'income' }, userId)
        }
        // Add default expenses
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
            // Check if budget for this category already exists
            const budgets = get().budgets
            const existing = budgets.find(b => b.category === budget.category && b.userId === userId)
            
            if (existing) {
                // Update existing instead
                await updateDoc(doc(db, 'budgets', existing.id), { amount: budget.amount })
            } else {
                await addDoc(collection(db, 'budgets'), {
                    ...budget,
                    userId,
                    createdAt: Timestamp.now()
                })
            }
        } catch (error: any) {
             console.error("Error adding/updating budget: ", error)
             alert(`Failed to save budget: ${error.message}`)
        }
      },

      removeBudget: async (id) => {
        try {
            await deleteDoc(doc(db, 'budgets', id))
        } catch (error) {
            console.error("Error removing budget: ", error)
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
                transactions.push({ id: doc.id, ...doc.data() } as Transaction)
            })
            set({ transactions, loading: false })
        }, (error) => {
            console.error("Error fetching transactions: ", error)
            set({ loading: false })
            if (error.code === 'failed-precondition') {
                alert("Firestore requires an Index for this query. Check the specific error link in your browser Console to create it in one click.")
            } else if (error.code === 'permission-denied') {
                alert("Permission denied. Check your Firestore Security Rules in Firebase Console.")
            }
        })

        return unsubscribe
      },

      subscribeToCategories: (userId) => {
        const q = query(
            collection(db, 'categories'),
            where("userId", "==", userId)
        )

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const categories: Category[] = []
            querySnapshot.forEach((doc) => {
                categories.push({ id: doc.id, ...doc.data() } as Category)
            })
            set({ categories })
        }, (error) => {
            console.error("Error fetching categories: ", error)
        })

        return unsubscribe
      },

      subscribeToBudgets: (userId) => {
        const q = query(
            collection(db, 'budgets'),
            where("userId", "==", userId)
        )

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const budgets: Budget[] = []
            querySnapshot.forEach((doc) => {
                budgets.push({ id: doc.id, ...doc.data() } as Budget)
            })
            set({ budgets })
        }, (error) => {
            console.error("Error fetching budgets: ", error)
        })

        return unsubscribe
      }
    }),
    {
      name: 'ledger-settings',
      partialize: (state) => ({ currency: state.currency }),
    }
  )
)
