import { Button } from "@/components/ui/button"
import { type Transaction } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Download } from "lucide-react"
import { format } from "date-fns"

interface ExportButtonProps {
  transactions: Transaction[]
  currency: 'IDR' | 'USD'
}

export function ExportButton({ transactions, currency }: ExportButtonProps) {
  const handleExport = () => {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.text("Ledger Wallet Report", 14, 22)
    
    doc.setFontSize(11)
    doc.text(`Generated on: ${format(new Date(), "PPP")}`, 14, 30)

    // Table
    const tableData = transactions.map(t => [
        format(new Date(t.date), "yyyy-MM-dd"),
        t.description || "",
        t.category,
        t.type.toUpperCase(),
        `${t.type === 'income' ? '+' : '-'} ${formatCurrency(Math.abs(t.amount), currency)}`
    ])

    autoTable(doc, {
        startY: 36,
        head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
        body: tableData,
    })

    // Save
    doc.save(`ledger_report_${format(new Date(), "yyyy-MM-dd")}.pdf`)
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Export PDF
    </Button>
  )
}
