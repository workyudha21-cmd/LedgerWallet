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
import { useAuthStore } from "@/lib/auth-store"
import { useTransactionStore, type Asset } from "@/lib/store"
import { formatCurrency, formatCurrencyInput } from "@/lib/utils"
import { format } from "date-fns"
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
    date: z.string().min(1, "Please select a date"),
    description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface ContributeAssetDialogProps {
    asset: Asset
    trigger?: React.ReactNode
}

export function ContributeAssetDialog({ asset, trigger }: ContributeAssetDialogProps) {
    const [open, setOpen] = useState(false)
    const user = useAuthStore((state) => state.user)
    const { accounts, currency, contributeToAsset } = useTransactionStore()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            accountId: accounts[0]?.id || "",
            amount: "",
            date: format(new Date(), "yyyy-MM-dd"),
            description: "",
        },
    })

    async function onSubmit(values: FormValues) {
        if (!user) return

        const amount = parseInt(values.amount.replace(/\D/g, ""), 10)
        const account = accounts.find(a => a.id === values.accountId)

        if (account && account.balance < amount) {
            form.setError("amount", { message: "Insufficient funds in selected account" })
            return
        }

        try {
            await contributeToAsset({
                assetId: asset.id,
                accountId: values.accountId,
                amount,
                date: new Date(`${values.date}T00:00:00`).toISOString(),
                description: values.description?.trim() || undefined,
            }, user.uid)

            setOpen(false)
            form.reset()
        } catch (error) {
            form.setError("amount", { message: (error as Error).message })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline" size="sm">Add Funds</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Funds to {asset.name}</DialogTitle>
                    <DialogDescription>
                        Move money from an account to this asset. This is a savings transfer, not income or expense.
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
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select account" />
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
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
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
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
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
                                        <Input placeholder={`Contribution to ${asset.name}`} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">Add Funds</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
