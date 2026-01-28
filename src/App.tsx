import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AppLayout } from "./components/layout/AppLayout"
import { Dashboard } from "./pages/Dashboard"
import { Transactions } from "./pages/Transactions"
import { Accounts } from "./pages/Accounts"
import { Recurring } from "./pages/Recurring"
import { ThemeProvider } from "./components/theme-provider"
import { Login } from "./pages/Login"
import { useAuthStore } from "./lib/auth-store"
import { useTransactionStore } from "./lib/store"
import { useEffect, useState } from "react"
import { auth } from "./lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  const setUser = useAuthStore((state) => state.setUser)
  const [loading, setLoading] = useState(true)

  const { subscribeToTransactions, subscribeToCategories, subscribeToBudgets, subscribeToAccounts, subscribeToRecurringTransactions } = useTransactionStore()

  useEffect(() => {
    let unsubscribeTransactions: () => void
    let unsubscribeCategories: () => void
    let unsubscribeBudgets: () => void
    let unsubscribeAccounts: () => void
    let unsubscribeRecurringTransactions: () => void

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Cleanup previous subscriptions if they exist to prevent permission errors on logout
      if (unsubscribeTransactions) unsubscribeTransactions()
      if (unsubscribeCategories) unsubscribeCategories()
      if (unsubscribeBudgets) unsubscribeBudgets()
      if (unsubscribeAccounts) unsubscribeAccounts()

      setUser(user)
      setLoading(false)
      
      if (user) {
        // Start listening to Firestore
        unsubscribeTransactions = subscribeToTransactions(user.uid)
        unsubscribeCategories = subscribeToCategories(user.uid)
        unsubscribeBudgets = subscribeToBudgets(user.uid)
        unsubscribeAccounts = subscribeToAccounts(user.uid)
        // Also subscribe to recurring (which triggers the processing loop)
        unsubscribeRecurringTransactions = subscribeToRecurringTransactions(user.uid)
      } else {
        // Clear transactions if logged out (optional but good for security)
        useTransactionStore.setState({ transactions: [], categories: [], budgets: [], accounts: [] })
      }
    })

    return () => {
        unsubscribeAuth()
        if (unsubscribeTransactions) unsubscribeTransactions()
        if (unsubscribeCategories) unsubscribeCategories()
        if (unsubscribeBudgets) unsubscribeBudgets()
        if (unsubscribeAccounts) unsubscribeAccounts()
        if (unsubscribeRecurringTransactions) unsubscribeRecurringTransactions()
    }
  }, [setUser, subscribeToTransactions, subscribeToCategories, subscribeToBudgets, subscribeToAccounts, subscribeToRecurringTransactions])

  // Auto-seed defaults if empty (migrating to DB-only source)
  const { categories, seedDefaults } = useTransactionStore()
  const user = useAuthStore(s => s.user)
  useEffect(() => {
     if (user && categories.length === 0 && !loading) {
         // Use a timeout to ensure real-time listener had a chance to fire
         const timer = setTimeout(() => {
             if (useTransactionStore.getState().categories.length === 0) {
                 seedDefaults(user.uid)
             }
         }, 2000)
         return () => clearTimeout(timer)
     }
  }, [user, categories.length, loading, seedDefaults])

  if (loading) return null

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
                <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="recurring" element={<Recurring />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
