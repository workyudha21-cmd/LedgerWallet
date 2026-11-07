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
import { cn, formatCurrency, formatCurrencyInput } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"
import { useTransactionStore, type RecurringLinkType, type RecurringTransaction } from "@/lib/store"
import { NoAccountsNotice } from "@/components/accounts/NoAccountsNotice"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
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
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/constants"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  amount: z.string().refine((val) => {
      const num = parseInt(val.replace(/\D/g, ""), 10)
      return !isNaN(num) && num > 0
  }, {
      message: "Amount must be a positive number."
  }),
  type: z.enum(["income", "expense"]),
  category: z.string().optional(),
  accountId: z.string().min(1, "Please select an account."),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  startDate: z.date(),
  linkId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddRecurringTransactionDialogProps {
  recurring?: RecurringTransaction
  trigger?: React.ReactNode
}

export function AddRecurringTransactionDialog({ recurring, trigger }: AddRecurringTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const {
    addRecurringTransaction,
    editRecurringTransaction,
    accounts,
    categories: customCategories,
    debts,
    assets,
    goals,
    currency,
  } = useTransactionStore()

  const initialType = recurring?.type === "savings" ? "expense" : recurring?.type || "expense"
  const initialLinkId = recurring?.linkType && recurring.linkId
    ? `${recurring.linkType}:${recurring.linkId}`
    : "none"

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: recurring?.name || "",
      amount: recurring ? formatCurrencyInput(String(recurring.amount)) : "",
      type: initialType,
      category: recurring?.category || "",
      accountId: recurring?.accountId || "",
      frequency: recurring?.frequency || "monthly",
      startDate: recurring ? new Date(recurring.nextRunDate) : new Date(),
      linkId: initialLinkId,
    },
    mode: "onChange"
  })

  // Watch type to filter categories
  const type = useWatch({ control: form.control, name: "type" })
  const linkId = useWatch({ control: form.control, name: "linkId" })
  const parsedLink = linkId && linkId !== "none" ? linkId.split(":") : null
  const linkType = parsedLink?.[0] as RecurringLinkType | undefined
  const isDebtLink = linkType === "debt"
  const isSavingsLink = linkType === "asset" || linkType === "goal"
  const isLinked = isDebtLink || isSavingsLink
  const defaultCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const relevantCustomCategories = customCategories.filter(c => c.type === type).map(c => c.name)
  const allCategories = Array.from(new Set([
    ...defaultCategories,
    ...relevantCustomCategories,
    ...(recurring?.category ? [recurring.category] : []),
  ]))
  const debtOptions = debts.filter(debt =>
    debt.type === 'payable' &&
    ((debt.status !== 'paid' && debt.remainingAmount > 0) || debt.id === recurring?.linkId)
  )

  async function onSubmit(values: FormValues) {
    if (!user) return

    const category = isSavingsLink
      ? linkType === "asset" ? "Asset Contribution" : "Goal Contribution"
      : values.category

    if (!category) {
      form.setError("category", { message: "Please select a category." })
      return
    }

    const linkTargetId = parsedLink ? parsedLink.slice(1).join(":") : null
    const recurringData = {
        name: values.name,
        amount: parseInt(values.amount.replace(/\D/g, ""), 10),
        type: isSavingsLink ? "savings" as const : isDebtLink ? "expense" as const : values.type,
        category,
        accountId: values.accountId,
        frequency: values.frequency,
        startDate: values.startDate.toISOString(),
        linkType: linkType ?? null,
        linkId: linkType ? linkTargetId : null,
    }

    if (recurring) {
        await editRecurringTransaction(recurring.id, recurringData)
        setOpen(false)
        return
    }

    await addRecurringTransaction({
        ...recurringData,
        nextRunDate: values.startDate.toISOString(),
        active: true
    }, user.uid)
    
    setOpen(false)
    form.reset()
  }

  function resetForm() {
    form.reset({
      name: recurring?.name || "",
      amount: recurring ? formatCurrencyInput(String(recurring.amount)) : "",
      type: initialType,
      category: recurring?.category || "",
      accountId: recurring?.accountId || "",
      frequency: recurring?.frequency || "monthly",
      startDate: recurring ? new Date(recurring.nextRunDate) : new Date(),
      linkId: initialLinkId,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Recurring
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{recurring ? "Edit Recurring Transaction" : "Add Recurring Transaction"}</DialogTitle>
          <DialogDescription>
            {recurring
              ? "Update this scheduled payment. The next run date is preserved."
              : "Create a subscription or scheduled payment, optionally linked to a debt, asset, or goal."}
          </DialogDescription>
        </DialogHeader>
        {accounts.length === 0 ? (
          <NoAccountsNotice
            description="Create an account before scheduling a recurring transaction."
            onClose={() => setOpen(false)}
          />
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Netflix, Rent" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="linkId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      if (value !== "none") {
                        form.setValue("type", "expense")
                        form.setValue("category", "")
                      }
                    }}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {debtOptions.map((debt) => (
                        <SelectItem key={`debt-${debt.id}`} value={`debt:${debt.id}`}>
                          Debt · {debt.personName} ({formatCurrency(debt.remainingAmount, currency)})
                        </SelectItem>
                      ))}
                      {assets.map((asset) => (
                        <SelectItem key={`asset-${asset.id}`} value={`asset:${asset.id}`}>
                          Asset · {asset.name}
                        </SelectItem>
                      ))}
                      {goals.map((goal) => (
                        <SelectItem key={`goal-${goal.id}`} value={`goal:${goal.id}`}>
                          Goal · {goal.name} ({formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isDebtLink && (
                    <p className="text-xs text-muted-foreground">
                      Each run records a debt payment, splits interest and principal, and reduces the debt. The rule stops when the debt is paid.
                    </p>
                  )}
                  {isSavingsLink && (
                    <p className="text-xs text-muted-foreground">
                      Each run moves money into the {linkType === "asset" ? "asset" : "goal"} as savings. It is excluded from expenses and budgets
                      {linkType === "goal" ? ", and the rule stops when the goal is fully funded." : "."}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className={isLinked ? "" : "grid grid-cols-2 gap-4"}>
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
                 {!isLinked && (
                 <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={(value) => {
                        field.onChange(value)
                        form.setValue("category", "")
                    }} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue />
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
                )}
            </div>

            <div className={isSavingsLink ? "" : "grid grid-cols-2 gap-4"}>
                 {!isSavingsLink && (
                 <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {allCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                            {cat}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    {allCategories.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                            No {type} categories available. Add one in Settings.
                        </p>
                    )}
                    </FormItem>
                )}
                />
                )}
                <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type})
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
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
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
                          date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">{recurring ? "Save Changes" : "Create Recurring"}</Button>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
