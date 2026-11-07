import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AppLayout } from "./components/layout/AppLayout"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/toaster"
import { PageLoader } from "./components/page-loader"
import { useAuthStore } from "./lib/auth-store"
import { useTransactionStore } from "./lib/store"
import { lazy, Suspense, useEffect, useState } from "react"
import { auth } from "./lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

const Landing = lazy(() => import("./pages/Landing").then((module) => ({ default: module.Landing })))
const Dashboard = lazy(() => import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })))
const Transactions = lazy(() => import("./pages/Transactions").then((module) => ({ default: module.Transactions })))
const Accounts = lazy(() => import("./pages/Accounts").then((module) => ({ default: module.Accounts })))
const Recurring = lazy(() => import("./pages/Recurring").then((module) => ({ default: module.Recurring })))
const Goals = lazy(() => import("./pages/Goals").then((module) => ({ default: module.Goals })))
const Debts = lazy(() => import("./pages/Debts").then((module) => ({ default: module.Debts })))
const Budget = lazy(() => import("./pages/Budget").then((module) => ({ default: module.Budget })))
const Assets = lazy(() => import("./pages/Assets").then((module) => ({ default: module.Assets })))
const NetWorth = lazy(() => import("./pages/NetWorth").then((module) => ({ default: module.NetWorth })))
const Reports = lazy(() => import("./pages/Reports").then((module) => ({ default: module.Reports })))
const Settings = lazy(() => import("./pages/Settings").then((module) => ({ default: module.Settings })))
const NotFound = lazy(() => import("./pages/NotFound").then((module) => ({ default: module.NotFound })))
const Login = lazy(() => import("./pages/Login").then((module) => ({ default: module.Login })))

function ProtectedRoute({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  const user = useAuthStore((state) => state.user)
  if (loading) return <PageLoader />
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

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute loading={loading}><AppLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
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
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  )
}

export default App
