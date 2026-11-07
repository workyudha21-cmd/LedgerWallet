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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/lib/auth-store"
import { useTransactionStore, type Asset } from "@/lib/store"
import { ASSET_CATEGORIES, type AssetCategory } from "@/lib/constants"
import { formatCurrencyInput } from "@/lib/utils"
import { Plus } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  category: z.enum(ASSET_CATEGORIES),
  currentValue: z.string().refine((val) => {
    const num = parseInt(val.replace(/\D/g, ""), 10)
    return !isNaN(num) && num > 0
  }, "Current value must be greater than 0"),
  purchasePrice: z.string().optional(),
  purchaseDate: z.string().optional(),
  valuationDate: z.string().optional(),
  notes: z.string().optional(),
  includeInNetWorth: z.boolean().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddAssetDialogProps {
  asset?: Asset
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddAssetDialog({ asset, trigger, open, onOpenChange }: AddAssetDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const { addAsset, editAsset } = useTransactionStore()
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen

  function handleOpenChange(isOpen: boolean) {
    if (!isControlled) setInternalOpen(isOpen)
    onOpenChange?.(isOpen)
    if (isOpen) resetForm()
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: asset?.name || "",
      category: asset?.category || "Property",
      currentValue: asset ? formatCurrencyInput(String(asset.currentValue)) : "",
      purchasePrice: asset?.purchasePrice ? formatCurrencyInput(String(asset.purchasePrice)) : "",
      purchaseDate: asset?.purchaseDate || "",
      valuationDate: asset?.valuationDate || "",
      notes: asset?.notes || "",
      includeInNetWorth: asset?.includeInNetWorth ?? true,
    },
  })

  function resetForm() {
    form.reset({
      name: asset?.name || "",
      category: asset?.category || "Property",
      currentValue: asset ? formatCurrencyInput(String(asset.currentValue)) : "",
      purchasePrice: asset?.purchasePrice ? formatCurrencyInput(String(asset.purchasePrice)) : "",
      purchaseDate: asset?.purchaseDate || "",
      valuationDate: asset?.valuationDate || "",
      notes: asset?.notes || "",
      includeInNetWorth: asset?.includeInNetWorth ?? true,
    })
  }

  async function onSubmit(values: FormValues) {
    if (!user) return

    const payload = {
      name: values.name,
      category: values.category as AssetCategory,
      currentValue: parseInt(values.currentValue.replace(/\D/g, ""), 10),
      purchasePrice: values.purchasePrice
        ? parseInt(values.purchasePrice.replace(/\D/g, ""), 10)
        : 0,
      purchaseDate: values.purchaseDate || null,
      valuationDate: values.valuationDate || null,
      notes: values.notes || "",
      includeInNetWorth: values.includeInNetWorth ?? true,
    }

    if (asset) {
      await editAsset(asset.id, payload)
      handleOpenChange(false)
      return
    }

    await addAsset(payload, user.uid)
    handleOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Asset
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{asset ? "Edit Asset" : "Add Asset"}</DialogTitle>
          <DialogDescription>
            {asset ? "Update this asset's value and details." : "Track property, vehicles, investments, and other assets."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. House, Car, Gold" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ASSET_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Value</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0"
                      {...field}
                      onChange={(event) => field.onChange(formatCurrencyInput(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Price (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0"
                      {...field}
                      onChange={(event) => field.onChange(formatCurrencyInput(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valuationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Valuation</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Location, condition, ownership notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="includeInNetWorth"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={Boolean(field.value)}
                      onChange={(event) => field.onChange(event.target.checked)}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Include in net worth</FormLabel>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              {asset ? "Save Changes" : "Create Asset"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
