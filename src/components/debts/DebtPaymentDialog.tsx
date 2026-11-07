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
import { NoAccountsNotice } from "@/components/accounts/NoAccountsNotice"
import { estimatePayoffAmount, splitDebtPayment } from "@/lib/debt"
import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
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
    const estimatedPayoff = isPayable
        ? estimatePayoffAmount(debt.remainingAmount, debt.interestRate)
        : debt.remainingAmount
    const defaultPayment = isPayable && debt.minimumPayment && debt.minimumPayment > 0
        ? Math.min(debt.minimumPayment, estimatedPayoff)
        : estimatedPayoff

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            accountId: "",
            amount: formatCurrencyInput(defaultPayment.toString()),
        },
    })

    const watchedAmount = useWatch({ control: form.control, name: "amount" })
    const paymentAmount = parseInt((watchedAmount || "").replace(/\D/g, ""), 10) || 0
    const split = isPayable && debt.interestRate && paymentAmount > 0
        ? splitDebtPayment(paymentAmount, debt.remainingAmount, debt.interestRate)
        : null

    useEffect(() => {
        if (!open) return

        form.reset({
            accountId: form.getValues("accountId"),
            amount: formatCurrencyInput(defaultPayment.toString()),
        })
    }, [open, defaultPayment, form])

    async function onSubmit(values: FormValues) {
        if (!user) return

        const amount = parseInt(values.amount.replace(/\D/g, ""), 10)

        if (amount <= 0) {
            form.setError("amount", { message: "Amount must be greater than 0" })
            return
        }

        if (amount > estimatedPayoff) {
            form.setError("amount", {
                message: `Amount exceeds the maximum payment of ${formatCurrency(estimatedPayoff, currency)}`,
            })
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
                        Remaining principal: {formatCurrency(debt.remainingAmount, currency)}
                        {isPayable && estimatedPayoff > debt.remainingAmount && (
                            <>
                                <br />
                                Estimated payoff: {formatCurrency(estimatedPayoff, currency)}
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>
                {accounts.length === 0 ? (
                    <NoAccountsNotice
                        description="Create an account before recording this payment."
                        onClose={() => setOpen(false)}
                    />
                ) : (
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
                                    {isPayable && estimatedPayoff > debt.remainingAmount && (
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="h-auto p-0 text-xs"
                                            onClick={() => form.setValue(
                                                "amount",
                                                formatCurrencyInput(estimatedPayoff.toString()),
                                                { shouldValidate: true }
                                            )}
                                        >
                                            Use estimated payoff ({formatCurrency(estimatedPayoff, currency)})
                                        </Button>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {split && (
                            <div className="space-y-1 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                                <p>Estimated interest: {formatCurrency(split.interestAmount, currency)}</p>
                                <p>Principal: {formatCurrency(split.principalAmount, currency)}</p>
                                <p>
                                    Remaining after payment: {formatCurrency(
                                        Math.max(0, debt.remainingAmount - split.principalAmount),
                                        currency
                                    )}
                                </p>
                            </div>
                        )}
                        <Button type="submit" className="w-full">
                            {isPayable ? "Pay" : "Receive"}
                        </Button>
                    </form>
                </Form>
                )}
            </DialogContent>
        </Dialog>
    )
}
