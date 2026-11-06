import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { type Asset, useTransactionStore } from "@/lib/store"
import { formatCurrency } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { Car, Home, MoreHorizontal, Pencil, Trash, TrendingUp, Wallet } from "lucide-react"
import { useState } from "react"
import { AddAssetDialog } from "./AddAssetDialog"
import { ContributeAssetDialog } from "./ContributeAssetDialog"

interface AssetCardProps {
  asset: Asset
  currency: "IDR" | "USD"
}

export function AssetCard({ asset, currency }: AssetCardProps) {
  const { debts, removeAsset } = useTransactionStore()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const linkedDebt = debts
    .filter(debt => debt.type === "payable" && debt.status !== "paid" && debt.assetId === asset.id)
    .reduce((sum, debt) => sum + debt.remainingAmount, 0)
  const equity = asset.currentValue - linkedDebt

  const hasPurchasePrice = Boolean(asset.purchasePrice && asset.purchasePrice > 0)
  const gain = hasPurchasePrice ? asset.currentValue - (asset.purchasePrice || 0) : 0
  const gainPercentage = hasPurchasePrice
    ? (gain / (asset.purchasePrice || 1)) * 100
    : 0

  const icon = asset.category === "Vehicle"
    ? <Car className="h-4 w-4" />
    : asset.category === "Property"
      ? <Home className="h-4 w-4" />
      : asset.category === "Investment"
        ? <TrendingUp className="h-4 w-4" />
        : <Wallet className="h-4 w-4" />

  return (
    <>
      <Card className="relative overflow-hidden transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {icon}
            {asset.name}
            {asset.includeInNetWorth === false && (
              <Badge variant="outline" className="text-[10px]">Excluded</Badge>
            )}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEdit(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDelete(true)} className="text-red-600">
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-bold">{formatCurrency(asset.currentValue, currency)}</div>
          {hasPurchasePrice && (
            <p className={`text-xs ${gain >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {gain >= 0 ? "+" : ""}{formatCurrency(gain, currency)} ({gainPercentage.toFixed(1)}%)
            </p>
          )}
          <p className="text-xs capitalize text-muted-foreground">{asset.category} Asset</p>
          {asset.valuationDate && (
            <p className="text-xs text-muted-foreground">
              Valued {format(parseISO(asset.valuationDate), "PP")}
            </p>
          )}
          {linkedDebt > 0 && (
            <div className="mt-2 space-y-1 border-t pt-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Linked debt</span>
                <span>{formatCurrency(linkedDebt, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Equity</span>
                <span className="font-medium text-foreground">{formatCurrency(equity, currency)}</span>
              </div>
            </div>
          )}
          {asset.notes && (
            <p className=" pt-2 text-xs italic text-muted-foreground">"{asset.notes}"</p>
          )}
          <div className="pt-3">
            <ContributeAssetDialog asset={asset} />
          </div>
        </CardContent>
      </Card>

      {showEdit && (
        <AddAssetDialog
          asset={asset}
          open={showEdit}
          onOpenChange={setShowEdit}
        />
      )}

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {asset.name}. Linked debts will remain but will no longer be connected to this asset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                removeAsset(asset.id)
                setShowDelete(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
