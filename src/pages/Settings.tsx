import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModeToggle } from "@/components/mode-toggle"
import { CurrencyToggle } from "@/components/currency-toggle"
import { CategoryManager } from "@/components/categories/CategoryManager"
import { ExportDialog } from "@/components/settings/ExportDialog"
import { BackupRestore } from "@/components/settings/BackupRestore"
import { CsvImport } from "@/components/settings/CsvImport"
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, AlertTriangle, Target } from "lucide-react"
import { useState } from "react"
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
import { notifyError, toastSuccess } from "@/lib/toast"

export function Settings() {
    const {
        resetData,
        transactions,
        accounts,
        assets,
        budgets,
        recurringTransactions,
        goals,
        debts,
        financialTargets,
        setFinancialTargets
    } = useTransactionStore()
    const { user } = useAuthStore()

    const [emergencyMonths, setEmergencyMonths] = useState(String(financialTargets.emergencyFundMonths))
    const [savingsTarget, setSavingsTarget] = useState(String(financialTargets.savingsRate))
    const [maxDti, setMaxDti] = useState(String(financialTargets.maxDti))
    const [targetsSaved, setTargetsSaved] = useState(false)

    const hasFinancialData =
        transactions.length > 0 ||
        accounts.length > 0 ||
        assets.length > 0 ||
        budgets.length > 0 ||
        recurringTransactions.length > 0 ||
        goals.length > 0 ||
        debts.length > 0

    const handleSaveTargets = () => {
        const nextTargets = {
            emergencyFundMonths: Math.min(24, Math.max(1, Number(emergencyMonths) || 1)),
            savingsRate: Math.min(100, Math.max(1, Number(savingsTarget) || 1)),
            maxDti: Math.min(100, Math.max(1, Number(maxDti) || 1)),
        }

        setFinancialTargets(nextTargets)
        setEmergencyMonths(String(nextTargets.emergencyFundMonths))
        setSavingsTarget(String(nextTargets.savingsRate))
        setMaxDti(String(nextTargets.maxDti))
        setTargetsSaved(true)
        toastSuccess("Financial targets saved")
    }

    const handleReset = async () => {
        if (!user) return
        try {
            await resetData(user.uid)
            // Simple reload or state refresh
            window.location.reload()
        } catch (error) {
            console.error(error)
            notifyError("Failed to reset data.")
        }
    }

    return (
        <div className="flex-1 space-y-4">
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
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Theme</label>
                                <p className="text-xs text-muted-foreground">Switch between light and dark mode.</p>
                            </div>
                            <ModeToggle />
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Currency</label>
                                <p className="text-xs text-muted-foreground">
                                    {hasFinancialData
                                        ? "Currency is locked while you have financial data so existing amounts are not relabeled."
                                        : "Select your preferred currency before adding data."}
                                </p>
                            </div>
                            <CurrencyToggle disabled={hasFinancialData} />
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Categories</label>
                                <p className="text-xs text-muted-foreground">Manage transaction categories.</p>
                            </div>
                            <div className="w-full sm:w-[180px]">
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
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Export Data</label>
                                <p className="text-xs text-muted-foreground">Download your transaction history.</p>
                            </div>
                            <ExportDialog />
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Import CSV</label>
                                <p className="text-xs text-muted-foreground">
                                    Import transactions from a spreadsheet export.
                                </p>
                            </div>
                            <CsvImport />
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Backup & Restore</label>
                                <p className="text-xs text-muted-foreground">
                                    Download a JSON backup or restore one into an empty account.
                                </p>
                            </div>
                            <BackupRestore />
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
                                                This action cannot be undone. This will permanently delete your transactions, accounts, assets, budgets, recurring transactions, goals, debts, and financial health history from our servers. Your custom categories will be kept.
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

                                <div className="pt-4 mt-4 border-t">
                                    <h4 className="text-sm font-medium text-red-600">Delete Account</h4>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Permanently delete your sign-in account and all data, including categories.
                                    </p>
                                    <DeleteAccountDialog />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Targets */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-4 w-4" /> Financial Targets
                        </CardTitle>
                        <CardDescription>
                            Customize the thresholds used by the Financial Health score.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="target-emergency">Emergency fund (months)</Label>
                                <Input
                                    id="target-emergency"
                                    type="number"
                                    min="1"
                                    max="24"
                                    value={emergencyMonths}
                                    onChange={(event) => {
                                        setEmergencyMonths(event.target.value)
                                        setTargetsSaved(false)
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="target-savings">Savings rate (%)</Label>
                                <Input
                                    id="target-savings"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={savingsTarget}
                                    onChange={(event) => {
                                        setSavingsTarget(event.target.value)
                                        setTargetsSaved(false)
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="target-dti">Maximum DTI (%)</Label>
                                <Input
                                    id="target-dti"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={maxDti}
                                    onChange={(event) => {
                                        setMaxDti(event.target.value)
                                        setTargetsSaved(false)
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={handleSaveTargets}>Save Targets</Button>
                            {targetsSaved && (
                                <span className="text-xs text-emerald-600">Saved</span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
