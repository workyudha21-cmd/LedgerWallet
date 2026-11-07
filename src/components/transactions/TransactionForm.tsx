import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

const formSchema = z.object({
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  amount: z.string().refine((val) => {
    const num = parseInt(val.replace(/\D/g, ""), 10)
    return !isNaN(num) && num > 0
  }, {
    message: "Amount must be a positive number.",
  }),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, { message: "Category is required" }),
  accountId: z.string().min(1, { message: "Account is required" }),
  debtId: z.string().optional(),
  date: z.date(),
})

export type TransactionFormValues = z.infer<typeof formSchema>

interface TransactionFormProps {
  defaultValues?: Partial<TransactionFormValues>
  onSubmit: (values: TransactionFormValues) => void
  submitLabel?: string
}

import { formatCurrency, formatCurrencyInput, cn } from "@/lib/utils"
import { useTransactionStore } from "@/lib/store"
import { estimatePayoffAmount } from "@/lib/debt"

export function TransactionForm({ defaultValues, onSubmit, submitLabel = "Save" }: TransactionFormProps) {
  const { categories, accounts, debts, currency } = useTransactionStore()
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: "",
      type: "expense",
      category: "",
      accountId: accounts.length > 0 ? accounts[0].id : "",
      debtId: "none",
      date: new Date(),
      ...defaultValues
    },
  })

  // Watch type change to reset category or filter options
  const type = useWatch({ control: form.control, name: "type" })

  const activePayables = debts.filter(
    debt => debt.type === "payable" && debt.status !== "paid" && debt.remainingAmount > 0
  )

  // Prepare category options
  const allCategories = categories
    .filter(c => c.type === type)
    .map(c => c.name)

  function handleSubmit(values: TransactionFormValues) {
    const amount = parseInt(values.amount.replace(/\D/g, ""), 10)
    const linkedDebt = activePayables.find(debt => debt.id === values.debtId)

    if (values.type === "expense" && linkedDebt) {
      const maxPayment = estimatePayoffAmount(linkedDebt.remainingAmount, linkedDebt.interestRate)
      if (amount > maxPayment) {
        form.setError("amount", {
          message: `Amount exceeds the estimated payoff of ${formatCurrency(maxPayment, currency)}.`,
        })
        return
      }
    }

    onSubmit(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.type})
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={(val) => {
                  field.onChange(val)
                  form.setValue("category", "")
                  form.setValue("debtId", "none")
              }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Groceries, Salary, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allCategories.map((category) => (
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
        {type === "expense" && activePayables.length > 0 && (
          <FormField
            control={form.control}
            name="debtId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Linked Liability (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "none"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {activePayables.map((debt) => (
                      <SelectItem key={debt.id} value={debt.id}>
                        {debt.personName} — {formatCurrency(debt.remainingAmount, currency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.value && field.value !== "none" && (
                  <p className="text-xs text-muted-foreground">
                    The payment reduces the liability principal. Interest is counted as an expense when the debt has an interest rate.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}
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
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
            <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Form>
  )
}
