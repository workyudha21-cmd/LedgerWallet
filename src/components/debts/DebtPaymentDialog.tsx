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
import { formatCurrencyInput, formatCurrency } from "@/lib/utils"
// import { Banknote } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"
import { useTransactionStore, type Debt } from "@/lib/store"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
    accountId: z.string().min(1, "Please select an account"),
    amount: z.string().refine((val) => {
        const num = parseInt(val.replace(/\D/g, ""), 10)
        return !isNaN(num) && num > 0
    }, "Amount must be greater than 0"),
})

type FormValues = z.infer<typeof formSchema>

interface DebtPaymentDialogProps {
    debt: Debt
    trigger?: React.ReactNode
}

export function DebtPaymentDialog({ debt, trigger }: DebtPaymentDialogProps) {
    const [open, setOpen] = useState(false)
    const { payDebt, accounts, currency } = useTransactionStore()
    const user = useAuthStore((state) => state.user)

    const isPayable = debt.type === 'payable' // I owe money

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            accountId: "",
            amount: formatCurrencyInput(debt.remainingAmount.toString()),
        },
    })

    async function onSubmit(values: FormValues) {
        if (!user) return

        const amount = parseInt(values.amount.replace(/\D/g, ""), 10)

        if (amount > debt.remainingAmount) {
            form.setError("amount", { message: "Payment exceeds remaining debt" })
            return
        }

        if (isPayable) {
            const account = accounts.find(a => a.id === values.accountId)
            if (account && account.balance < amount) {
                form.setError("amount", { message: "Insufficient funds in account" })
                return
            }
        }

        await payDebt(debt.id, amount, values.accountId, user.uid)

        setOpen(false)
        form.reset()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button size="sm">Record Payment</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {isPayable ? "Pay Debt" : "Receive Payment"}
                    </DialogTitle>
                    <DialogDescription>
                        {isPayable
                            ? `Recording payment to ${debt.personName}`
                            : `Recording payment from ${debt.personName}`}
                        <br />
                        Remaining: {formatCurrency(debt.remainingAmount, currency)}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="accountId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Using Account</FormLabel>
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
                        <Button type="submit" className="w-full">
                            {isPayable ? "Pay" : "Receive"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
