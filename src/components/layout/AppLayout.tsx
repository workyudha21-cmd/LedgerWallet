import { Outlet, Link } from "react-router-dom"
import { LayoutDashboard, Receipt, LogOut, Menu, Wallet } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { CurrencyToggle } from "@/components/currency-toggle"
import { useAuthStore } from "@/lib/auth-store"
import { CategoryManager } from "@/components/categories/CategoryManager"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/firebase"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useState } from "react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const { user } = useAuthStore()

  const handleLogout = () => {
    auth.signOut()
    if (onLinkClick) onLinkClick()
  }

  return (
    <>
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
          onClick={onLinkClick}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          to="/transactions"
          className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted transition-colors"
          onClick={onLinkClick}
        >
          <Receipt className="h-4 w-4" />
          Transactions
        </Link>
        <Link
          to="/accounts"
          className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted transition-colors"
          onClick={onLinkClick}
        >
          <Wallet className="h-4 w-4" />
          Accounts
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
    </>
  )
}

export function AppLayout() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      {/* Sidebar - Desktop */}
      <aside className="w-64 border-r border-border p-4 bg-card hidden md:flex flex-col">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden border-b p-4 flex items-center bg-card">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="-ml-2">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-4">
                    <VisuallyHidden>
                        <SheetTitle>Menu</SheetTitle>
                    </VisuallyHidden>
                    <div className="flex flex-col h-full">
                        <SidebarContent onLinkClick={() => setIsOpen(false)} />
                    </div>
                </SheetContent>
            </Sheet>
            <span className="ml-2 font-semibold">Ledger Wallet</span>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
            <Outlet />
        </main>
      </div>
    </div>
  )
}
