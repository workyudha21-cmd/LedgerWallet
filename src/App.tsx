import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AppLayout } from "./components/layout/AppLayout"
import { Dashboard } from "./pages/Dashboard"
import { Transactions } from "./pages/Transactions"
import { Accounts } from "./pages/Accounts"
import { Recurring } from "./pages/Recurring"
import { Goals } from "./pages/Goals"
import { Debts } from "./pages/Debts"
import { Budget } from "./pages/Budget"
import { Assets } from "./pages/Assets"
import { NetWorth } from "./pages/NetWorth"
import { Reports } from "./pages/Reports"
import { Settings } from "./pages/Settings"
import { NotFound } from "./pages/NotFound"
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

  const {
    subscribeToTransactions,
    subscribeToCategories,
    subscribeToBudgets,
    subscribeToAccounts,
    subscribeToAssets,
    subscribeToRecurringTransactions,
    subscribeToGoals,
    subscribeToDebts,
    subscribeToHealthSnapshots
  } = useTransactionStore()


  useEffect(() => {
    let unsubscribers: Array<() => void> = []

    const cleanup = () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
      unsubscribers = []
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      cleanup()
      setUser(user)
      setLoading(false)

      // Clear the previous user's data before loading the current user's snapshot
      useTransactionStore.setState({
        transactions: [],
        categories: [],
        budgets: [],
        accounts: [],
        assets: [],
        recurringTransactions: [],
        goals: [],
        debts: [],
        healthSnapshots: []
      })

      if (user) {
        unsubscribers = [
          subscribeToTransactions(user.uid),
          subscribeToCategories(user.uid),
          subscribeToBudgets(user.uid),
          subscribeToAccounts(user.uid),
          subscribeToAssets(user.uid),
          subscribeToRecurringTransactions(user.uid),
          subscribeToGoals(user.uid),
          subscribeToDebts(user.uid),
          subscribeToHealthSnapshots(user.uid)
        ]
      }
    })

    return () => {
      unsubscribeAuth()
      cleanup()
    }
  }, [setUser, subscribeToTransactions, subscribeToCategories, subscribeToBudgets, subscribeToAccounts, subscribeToAssets, subscribeToRecurringTransactions, subscribeToGoals, subscribeToDebts, subscribeToHealthSnapshots])


  // Auto-seed defaults if empty (migrating to DB-only source)
  const { categories, seedDefaults } = useTransactionStore()
  const user = useAuthStore(s => s.user)
  useEffect(() => {
    if (!user || loading) return

    const seedKey = `ledger-defaults-seeded:${user.uid}`

    if (categories.length > 0) {
      localStorage.setItem(seedKey, "true")
      return
    }

    if (localStorage.getItem(seedKey)) return

    // Use a timeout to ensure real-time listener had a chance to fire
    const timer = setTimeout(async () => {
      if (useTransactionStore.getState().categories.length === 0) {
        await seedDefaults(user.uid)
        localStorage.setItem(seedKey, "true")
      }
    }, 2000)
    return () => clearTimeout(timer)
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
            <Route path="assets" element={<Assets />} />
            <Route path="net-worth" element={<NetWorth />} />
            <Route path="recurring" element={<Recurring />} />
            <Route path="goals" element={<Goals />} />
            <Route path="debts" element={<Debts />} />
            <Route path="budget" element={<Budget />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
