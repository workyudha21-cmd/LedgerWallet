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
import { ACCOUNT_TYPES, isAssetAccountType, isLiquidAccountType } from "@/lib/constants"
import { useAuthStore } from "@/lib/auth-store"
import { useTransactionStore, type Account } from "@/lib/store"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Plus } from "lucide-react"
import { formatCurrencyInput } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  type: z.string().min(1, "Please select an account type."),
  initialBalance: z.string().refine((val) => {
    const num = parseInt(val.replace(/\D/g, ""), 10)
    return !isNaN(num) && num >= 0
  }, {
    message: "Balance must be a positive number.",
  }),
  isLiquid: z.boolean().optional(),
  isEmergencyFund: z.boolean().optional(),
  includeInNetWorth: z.boolean().optional(),
  purchasePrice: z.string().optional(),
  purchaseDate: z.string().optional(),
  valuationDate: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function AddAccountDialog() {
  const [open, setOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const addAccount = useTransactionStore((state) => state.addAccount)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "", 
      initialBalance: "0",
      isLiquid: true,
      isEmergencyFund: false,
      includeInNetWorth: true,
      purchasePrice: "",
      purchaseDate: "",
      valuationDate: "",
      notes: "",
    },
    mode: "onChange",
  })

  const accountType = form.watch("type")
  const showAssetDetails = isAssetAccountType(accountType)

  function onSubmit(values: FormValues) {
    if (!user) return

    addAccount({
        name: values.name,
        type: values.type as Account['type'],
        balance: parseInt(values.initialBalance.replace(/\D/g, ""), 10),
        isLiquid: values.isLiquid ?? true,
        isEmergencyFund: values.isEmergencyFund ?? false,
        includeInNetWorth: values.includeInNetWorth ?? true,
        purchasePrice: values.purchasePrice
            ? parseInt(values.purchasePrice.replace(/\D/g, ""), 10)
            : 0,
        purchaseDate: values.purchaseDate || null,
        valuationDate: values.valuationDate || null,
        notes: values.notes || "",
    }, user.uid)
    
    setOpen(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
          <DialogDescription>
            Create a new wallet or account to track.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. BCA, Cash, GoPay" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      form.setValue("isLiquid", isLiquidAccountType(value))
                      if (!isAssetAccountType(value)) {
                        form.setValue("purchasePrice", "")
                        form.setValue("purchaseDate", "")
                        form.setValue("valuationDate", "")
                        form.setValue("notes", "")
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACCOUNT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{showAssetDetails ? "Current Value" : "Initial Balance"}</FormLabel>
                  <FormControl>
                     <Input 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(formatCurrencyInput(e.target.value))}
                     />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showAssetDetails && (
              <>
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
                <div className="grid grid-cols-2 gap-4">
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
              </>
            )}
            <FormField
              control={form.control}
              name="isLiquid"
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
                  <FormLabel className="font-normal">Liquid asset</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isEmergencyFund"
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
                  <FormLabel className="font-normal">Use as emergency fund</FormLabel>
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
            <Button type="submit" className="w-full">Create Account</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
