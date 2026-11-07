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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useAuthStore } from "@/lib/auth-store"
import { useTransactionStore } from "@/lib/store"
import { NoAccountsNotice } from "@/components/accounts/NoAccountsNotice"
import { cn, formatCurrency, formatCurrencyInput } from "@/lib/utils"
import { CalendarIcon, ArrowRightLeft } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  fromAccountId: z.string().min(1, "Select a source account."),
  toAccountId: z.string().min(1, "Select a destination account."),
  amount: z.string().refine((val) => {
    const num = parseInt(val.replace(/\D/g, ""), 10)
    return !isNaN(num) && num > 0
  }, {
    message: "Amount must be a positive number.",
  }),
  description: z.string().optional(),
  date: z.date(),
}).refine((values) => values.fromAccountId !== values.toAccountId, {
  message: "Source and destination accounts must be different.",
  path: ["toAccountId"],
})

type FormValues = z.infer<typeof formSchema>

interface TransferDialogProps {
  trigger?: React.ReactNode
}

export function TransferDialog({ trigger }: TransferDialogProps) {
  const [open, setOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const { accounts, currency, transferBetweenAccounts } = useTransactionStore()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromAccountId: accounts[0]?.id || "",
      toAccountId: accounts[1]?.id || "",
      amount: "",
      description: "",
      date: new Date(),
    },
  })

  async function onSubmit(values: FormValues) {
    if (!user) return

    try {
      await transferBetweenAccounts({
        fromAccountId: values.fromAccountId,
        toAccountId: values.toAccountId,
        amount: parseInt(values.amount.replace(/\D/g, ""), 10),
        date: values.date.toISOString(),
        description: values.description?.trim() || undefined,
      }, user.uid)

      setOpen(false)
      form.reset()
    } catch (error) {
      form.setError("amount", { message: (error as Error).message })
    }
  }

  function resetForm() {
    form.reset({
      fromAccountId: accounts[0]?.id || "",
      toAccountId: accounts[1]?.id || "",
      amount: "",
      description: "",
      date: new Date(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Between Accounts</DialogTitle>
          <DialogDescription>
            Move money between your accounts without affecting income or expenses.
          </DialogDescription>
        </DialogHeader>

        {accounts.length < 2 ? (
          <NoAccountsNotice
            title="Two accounts required"
            description="Create at least two accounts before making a transfer."
            onClose={() => setOpen(false)}
          />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fromAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Source account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} ({formatCurrency(account.balance, currency)})
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
                  name="toAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Destination account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} ({formatCurrency(account.balance, currency)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
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

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Move to savings" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">Transfer</Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
