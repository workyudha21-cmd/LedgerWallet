import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/mode-toggle"
import { CurrencyToggle } from "@/components/currency-toggle"
import { CategoryManager } from "@/components/categories/CategoryManager"
import { ExportDialog } from "@/components/settings/ExportDialog"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useTransactionStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"

export function Settings() {
    const { resetData } = useTransactionStore()
    const { user } = useAuthStore()

    const handleReset = async () => {
        if (!user) return
        try {
            await resetData(user.uid)
            // Simple reload or state refresh
            window.location.reload()
        } catch (error) {
            console.error(error)
            alert("Failed to reset data.")
        }
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {/* Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle>Preferences</CardTitle>
                        <CardDescription>Customize your experience.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Theme</label>
                                <p className="text-xs text-muted-foreground">Switch between light and dark mode.</p>
                            </div>
                            <ModeToggle />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Currency</label>
                                <p className="text-xs text-muted-foreground">Select your preferred currency.</p>
                            </div>
                            <CurrencyToggle />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Categories</label>
                                <p className="text-xs text-muted-foreground">Manage transaction categories.</p>
                            </div>
                            <div className="w-[180px]">
                                <CategoryManager />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Data Management */}
                <Card>
                    <CardHeader>
                        <CardTitle>Data Management</CardTitle>
                        <CardDescription>Control your data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Export Data</label>
                                <p className="text-xs text-muted-foreground">Download your transaction history.</p>
                            </div>
                            <ExportDialog />
                        </div>

                        <div className="pt-4 border-t">
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" /> Danger Zone
                                </h4>
                                <p className="text-xs text-muted-foreground">Once you delete your data, there is no going back. Please be certain.</p>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full sm:w-auto">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete All Data
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete your transactions, budgets, goals, debts, and account balances from our servers.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
                                                Yes, delete everything
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
