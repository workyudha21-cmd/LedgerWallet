import { useRef, useState, type ChangeEvent } from "react"
import { format } from "date-fns"
import { AlertTriangle, FileSpreadsheet, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/lib/auth-store"
import { useTransactionStore } from "@/lib/store"
import { parseTransactionCsv, type CsvImportRow } from "@/lib/csv"
import { formatCurrency } from "@/lib/utils"
import { toastError, toastSuccess } from "@/lib/toast"

export function CsvImport() {
  const [open, setOpen] = useState(false)
  const [fileName, setFileName] = useState("")
  const [rows, setRows] = useState<CsvImportRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { accounts, currency, importTransactions } = useTransactionStore()
  const user = useAuthStore((state) => state.user)

  function reset() {
    setFileName("")
    setRows([])
    setErrors([])
    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    try {
      const text = await file.text()
      const result = parseTransactionCsv(text, {
        accounts: accounts.map((account) => ({ id: account.id, name: account.name })),
        currency,
      })

      setRows(result.rows)
      setErrors(result.errors)
    } catch (error) {
      setRows([])
      setErrors([`Could not read the file: ${(error as Error).message}`])
    }
  }

  async function handleImport() {
    if (!user || rows.length === 0 || errors.length > 0) return

    setImporting(true)
    try {
      const count = await importTransactions(
        rows.map((row) => ({
          date: row.date,
          description: row.description,
          amount: row.amount,
          type: row.type,
          category: row.category,
          accountId: row.accountId,
        })),
        user.uid
      )
      toastSuccess(
        `${count} transaction${count === 1 ? "" : "s"} imported`,
        "Account balances were updated."
      )
      setOpen(false)
      reset()
    } catch (error) {
      toastError("Import failed", (error as Error).message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Import Transactions from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns Date, Description, Amount, Type, Category, and Account.
            Only income and expense rows are imported. Invalid rows are rejected before anything is saved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              Dates: YYYY-MM-DD or DD/MM/YYYY (IDR) / MM/DD/YYYY (USD). Types: income or expense
              (pemasukan/pengeluaran). Account must match an existing account name.
            </p>
          </div>

          {fileName && (
            <div className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{fileName}</span>
              <span className="text-muted-foreground">
                · {rows.length} valid row{rows.length === 1 ? "" : "s"}
              </span>
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600">
                <AlertTriangle className="h-4 w-4" />
                {errors.length} error{errors.length === 1 ? "" : "s"} found
              </div>
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-red-600">
                {errors.map((error, index) => (
                  <li key={`${error}-${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {rows.length > 0 && (
            <div className="max-h-64 overflow-auto rounded-md border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-muted/90 text-muted-foreground">
                  <tr>
                    <th className="p-2 font-medium">Date</th>
                    <th className="p-2 font-medium">Description</th>
                    <th className="p-2 font-medium">Type</th>
                    <th className="p-2 font-medium">Category</th>
                    <th className="p-2 text-right font-medium">Amount</th>
                    <th className="p-2 font-medium">Account</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 8).map((row) => (
                    <tr key={row.rowNumber} className="border-t">
                      <td className="whitespace-nowrap p-2">
                        {format(new Date(row.date), "yyyy-MM-dd")}
                      </td>
                      <td className="max-w-[180px] truncate p-2" title={row.description}>
                        {row.description || "—"}
                      </td>
                      <td className="p-2 capitalize">{row.type}</td>
                      <td className="max-w-[140px] truncate p-2" title={row.category}>
                        {row.category}
                      </td>
                      <td className="whitespace-nowrap p-2 text-right">
                        {formatCurrency(row.amount, currency)}
                      </td>
                      <td className="p-2">{row.accountName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 8 && (
                <p className="border-t p-2 text-xs text-muted-foreground">
                  Showing the first 8 of {rows.length} rows.
                </p>
              )}
            </div>
          )}

          {accounts.length === 0 && (
            <p className="text-sm text-red-600">
              Create an account before importing transactions.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || rows.length === 0 || errors.length > 0 || accounts.length === 0}
            >
              {importing
                ? "Importing..."
                : rows.length > 0
                  ? `Import ${rows.length} Transaction${rows.length === 1 ? "" : "s"}`
                  : "Import Transactions"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
