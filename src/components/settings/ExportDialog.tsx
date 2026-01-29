import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTransactionStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"

export function ExportDialog() {
    const [range, setRange] = useState("all")
    const [open, setOpen] = useState(false)
    const { transactions, currency } = useTransactionStore()

    const getFilteredTransactions = () => {
        const now = new Date()
        let filtered = [...transactions]

        if (range === 'this_month') {
            filtered = filtered.filter(t =>
                new Date(t.date).getMonth() === now.getMonth() &&
                new Date(t.date).getFullYear() === now.getFullYear()
            )
        } else if (range === 'last_month') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            filtered = filtered.filter(t =>
                new Date(t.date).getMonth() === lastMonth.getMonth() &&
                new Date(t.date).getFullYear() === lastMonth.getFullYear()
            )
        }
        // 'all' returns everything
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    const exportToCSV = () => {
        const data = getFilteredTransactions()
        if (data.length === 0) return

        const headers = ["Date", "Type", "Category", "Amount", "Account", "Description"]
        const rows = data.map(t => [
            format(new Date(t.date), "yyyy-MM-dd"),
            t.type,
            t.category,
            t.amount,
            t.accountId || "N/A",
            `"${(t.description || "").replace(/"/g, '""')}"` // Escape quotes
        ])

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `ledger_export_${range}_${format(new Date(), "yyyyMMdd")}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setOpen(false)
    }

    const exportToPDF = () => {
        const data = getFilteredTransactions()
        if (data.length === 0) return

        const doc = new jsPDF()

        const totalIncome = data.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0)
        const totalExpense = data.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
        const net = totalIncome - totalExpense

        doc.setFontSize(18)
        doc.text("Transaction Report", 14, 22)

        doc.setFontSize(11)
        doc.text(`Range: ${range === 'all' ? 'All Time' : range.replace('_', ' ')}`, 14, 30)
        doc.text(`Generated: ${format(new Date(), "PPP")}`, 14, 36)

        doc.text(`Total Income: ${formatCurrency(totalIncome, currency)}`, 14, 46)
        doc.text(`Total Expense: ${formatCurrency(totalExpense, currency)}`, 14, 52)
        doc.text(`Net Balance: ${formatCurrency(net, currency)}`, 14, 58)

        const tableData = data.map(t => [
            format(new Date(t.date), "yyyy-MM-dd"),
            t.type,
            t.category,
            formatCurrency(t.amount, currency),
            t.description || "-"
        ])

        autoTable(doc, {
            startY: 65,
            head: [['Date', 'Type', 'Category', 'Amount', 'Description']],
            body: tableData,
        })

        doc.save(`ledger_report_${range}_${format(new Date(), "yyyyMMdd")}.pdf`)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" /> Export Data
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Export Transactions</DialogTitle>
                    <DialogDescription>
                        Download your transaction history as CSV or PDF.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Date Range</label>
                        <Select value={range} onValueChange={setRange}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="this_month">This Month</SelectItem>
                                <SelectItem value="last_month">Last Month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2 justify-end pt-4">
                        <Button onClick={exportToCSV} className="flex-1" variant="outline">
                            <FileSpreadsheet className="mr-2 h-4 w-4" /> CSV
                        </Button>
                        <Button onClick={exportToPDF} className="flex-1">
                            <FileText className="mr-2 h-4 w-4" /> PDF
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
