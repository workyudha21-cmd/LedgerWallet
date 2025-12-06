import { Outlet, Link } from "react-router-dom"
import { LayoutDashboard, Receipt, LogOut } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { CurrencyToggle } from "@/components/currency-toggle"
import { useAuthStore } from "@/lib/auth-store"
import { CategoryManager } from "@/components/categories/CategoryManager"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/firebase"

export function AppLayout() {
  const { user } = useAuthStore()

  const handleLogout = () => {
    auth.signOut()
  }

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border p-4 bg-card hidden md:flex flex-col">
        <div className="flex items-center gap-3 mb-8 px-2">
             <Avatar>
                <AvatarImage src={user?.photoURL || ""} />
                <AvatarFallback>{user?.displayName?.charAt(0) || "U"}</AvatarFallback>
             </Avatar>
             <div className="flex flex-col overflow-hidden">
                <span className="font-bold truncate">{user?.displayName || "User"}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
             </div>
        </div>
        <nav className="space-y-2 flex-1">
          <Link
            to="/"
            className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            to="/transactions"
            className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted transition-colors"
          >
            <Receipt className="h-4 w-4" />
            Transactions
          </Link>
        </nav>

        <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground tracking-wider">PREFERENCES</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <CurrencyToggle />
                </div>
                <ModeToggle />
            </div>
            <CategoryManager />
             <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
            </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
