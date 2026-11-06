import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTransactionStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"
import { AddAssetDialog } from "@/components/assets/AddAssetDialog"
import { AssetCard } from "@/components/assets/AssetCard"
import { Building2, Scale, TrendingDown } from "lucide-react"

export function Assets() {
  const { assets, debts, currency } = useTransactionStore()

  const includedAssets = assets.filter(asset => asset.includeInNetWorth !== false)
  const includedIds = new Set(includedAssets.map(asset => asset.id))
  const activePayables = debts.filter(
    debt => debt.type === "payable" && debt.status !== "paid" && debt.remainingAmount > 0
  )

  const totalAssets = includedAssets.reduce((sum, asset) => sum + asset.currentValue, 0)
  const totalLinkedDebt = activePayables
    .filter(debt => debt.assetId && includedIds.has(debt.assetId))
    .reduce((sum, debt) => sum + debt.remainingAmount, 0)
  const totalEquity = totalAssets - totalLinkedDebt

  const sortedAssets = [...assets].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="flex-1 space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Assets</h2>
          <p className="text-muted-foreground">Property, vehicles, investments, and other non-cash assets.</p>
        </div>
        <div className="flex items-center w-full md:w-auto">
          <AddAssetDialog />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asset Value</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAssets, currency)}</div>
            <p className="text-xs text-muted-foreground">
              {includedAssets.length} assets included in net worth
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Linked Debt</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(totalLinkedDebt, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Mortgages, auto loans, and other linked liabilities
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Equity</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalEquity >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {formatCurrency(totalEquity, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Asset value minus linked debt
            </p>
          </CardContent>
        </Card>
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 p-10 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">No assets recorded yet.</p>
            <p className="text-sm text-muted-foreground">
              Add a house, vehicle, investment, or other asset to include it in net worth.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedAssets.map(asset => (
            <AssetCard key={asset.id} asset={asset} currency={currency} />
          ))}
        </div>
      )}
    </div>
  )
}
