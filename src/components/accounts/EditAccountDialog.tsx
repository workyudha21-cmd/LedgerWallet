import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ACCOUNT_TYPES, isLiquidAccountType } from "@/lib/constants"
import { useAuthStore } from "@/lib/auth-store"
import { useTransactionStore, type Account } from "@/lib/store"
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
import { useEffect } from "react"
import { formatCurrencyInput } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  type: z.string().min(1, "Please select an account type."),
  balance: z.string().refine((val) => {
    const num = parseInt(val.replace(/\D/g, ""), 10)
    return !isNaN(num)
  }, {
    message: "Balance must be a valid number.",
  }),
  isLiquid: z.boolean().optional(),
  isEmergencyFund: z.boolean().optional(),
  includeInNetWorth: z.boolean().optional(),
})

type FormValues = z.infer<typeof formSchema>

function formatSignedAmount(value: string) {
  const isNegative = value.trim().startsWith("-")
  const formatted = formatCurrencyInput(value)
  if (!formatted) return isNegative ? "-" : ""
  return isNegative ? `-${formatted}` : formatted
}

function parseSignedAmount(value: string) {
  const isNegative = value.trim().startsWith("-")
  const digits = value.replace(/\D/g, "")
  if (!digits) return 0
  const amount = parseInt(digits, 10)
  return isNegative ? -amount : amount
}

interface EditAccountDialogProps {
    account: Account
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditAccountDialog({ account, open, onOpenChange }: EditAccountDialogProps) {
  const user = useAuthStore((state) => state.user)
  const editAccount = useTransactionStore((state) => state.editAccount)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account.name,
      type: account.type, 
      balance: formatSignedAmount(String(account.balance ?? 0)),
      isLiquid: account.isLiquid ?? isLiquidAccountType(account.type),
      isEmergencyFund: account.isEmergencyFund ?? false,
      includeInNetWorth: account.includeInNetWorth ?? true,
    },
    mode: "onChange",
  })

  // Reset form when account changes
  useEffect(() => {
    form.reset({
        name: account.name,
        type: account.type,
        balance: formatSignedAmount(String(account.balance ?? 0)),
        isLiquid: account.isLiquid ?? isLiquidAccountType(account.type),
        isEmergencyFund: account.isEmergencyFund ?? false,
        includeInNetWorth: account.includeInNetWorth ?? true
    })
  }, [account, form])

  function onSubmit(values: FormValues) {
    if (!user) return

    editAccount(account.id, {
        name: values.name,
        type: values.type as Account['type'],
        balance: parseSignedAmount(values.balance),
        isLiquid: values.isLiquid ?? isLiquidAccountType(values.type),
        isEmergencyFund: values.isEmergencyFund ?? false,
        includeInNetWorth: values.includeInNetWorth ?? true,
    })
    
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>
            Update account details.
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
                    onValueChange={field.onChange}
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
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Balance</FormLabel>
                  <FormControl>
                     <Input 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(formatSignedAmount(e.target.value))}
                     />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
