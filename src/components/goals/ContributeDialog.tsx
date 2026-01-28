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
import { useTransactionStore, type FinancialGoal } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
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
import { formatCurrencyInput, formatCurrency } from "@/lib/utils"
// import { TrendingUp } from "lucide-react" 
// Using Plus or similar icon from lucide if needed, likely call-site handles trigger button

const formSchema = z.object({
  accountId: z.string().min(1, "Please select an account"),
  amount: z.string().refine((val) => {
    const num = parseInt(val.replace(/\D/g, ""), 10)
    return !isNaN(num) && num > 0
  }, "Amount must be greater than 0"),
})

type FormValues = z.infer<typeof formSchema>

interface ContributeDialogProps {
    goal: FinancialGoal
    trigger?: React.ReactNode
}

export function ContributeDialog({ goal, trigger }: ContributeDialogProps) {
  const [open, setOpen] = useState(false)
  const { contributeToGoal, accounts, currency } = useTransactionStore()
  const user = useAuthStore((state) => state.user)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountId: "",
      amount: "",
    },
  })

  async function onSubmit(values: FormValues) {
    if (!user) return
    
    const amount = parseInt(values.amount.replace(/\D/g, ""), 10)
    
    // Check balance
    const account = accounts.find(a => a.id === values.accountId)
    if (account && account.balance < amount) {
        form.setError("amount", { message: "Insufficient funds in selected account" })
        return
    }

    await contributeToGoal(goal.id, values.accountId, amount, user.uid)
    
    setOpen(false)
    form.reset()
  }

  const remaining = goal.targetAmount - goal.currentAmount

  return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || <Button variant="outline" size="sm">Add Funds</Button>}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contribute to {goal.name}</DialogTitle>
            <DialogDescription>
              Add funds from your wallet to this goal.
              <br/>
              Remaining: {formatCurrency(remaining, currency)}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name} ({formatCurrency(acc.balance, currency)})
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contribution Amount</FormLabel>
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
              <Button type="submit" className="w-full">Contribute</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
  )
}
