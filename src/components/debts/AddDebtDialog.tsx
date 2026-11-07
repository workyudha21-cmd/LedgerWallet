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
import { formatCurrencyInput, cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"
import { useTransactionStore, type Debt } from "@/lib/store"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Textarea } from "@/components/ui/textarea"
import {
    LIABILITY_TYPES,
    LIABILITY_TYPE_LABELS,
    type LiabilityType
} from "@/lib/constants"

const formSchema = z.object({
    type: z.enum(["payable", "receivable"]),
    personName: z.string().min(2, "Name must be at least 2 characters"),
    amount: z.string().refine((val) => {
        const num = parseInt(val.replace(/\D/g, ""), 10)
        return !isNaN(num) && num > 0
    }, "Amount must be greater than 0"),
    minimumPayment: z.string(),
    interestRate: z.string(),
    liabilityType: z.enum(LIABILITY_TYPES).optional(),
    creditLimit: z.string().optional(),
    statementDay: z.string().optional(),
    assetId: z.string().optional(),
    dueDate: z.date().optional(),
    description: z.string().optional()
})

type FormValues = z.infer<typeof formSchema>

interface AddDebtDialogProps {
    debt?: Debt
    trigger?: React.ReactNode
}

export function AddDebtDialog({ debt, trigger }: AddDebtDialogProps) {
    const [open, setOpen] = useState(false)
    const user = useAuthStore((state) => state.user)
    const { addDebt, editDebt, assets } = useTransactionStore()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: debt?.type || "payable",
            personName: debt?.personName || "",
            amount: debt ? formatCurrencyInput(String(debt.totalAmount)) : "",
            minimumPayment: debt?.minimumPayment ? formatCurrencyInput(String(debt.minimumPayment)) : "",
            interestRate: debt?.interestRate ? String(debt.interestRate) : "",
            liabilityType: debt?.liabilityType || "other",
            creditLimit: debt?.creditLimit ? formatCurrencyInput(String(debt.creditLimit)) : "",
            statementDay: debt?.statementDay ? String(debt.statementDay) : "",
            assetId: debt?.assetId || "none",
            dueDate: debt?.dueDate ? new Date(debt.dueDate) : undefined,
            description: debt?.description || ""
        },
    })

    const debtType = useWatch({ control: form.control, name: "type" })
    const selectedLiabilityType = useWatch({ control: form.control, name: "liabilityType" })
    const isPayable = debtType === "payable"
    const isCreditCard = isPayable && selectedLiabilityType === "creditCard"

    async function onSubmit(values: FormValues) {
        if (!user) return

        const totalAmount = parseInt(values.amount.replace(/\D/g, ""), 10)
        const minimumPayment = values.minimumPayment
            ? parseInt(values.minimumPayment.replace(/\D/g, ""), 10)
            : 0
        const interestRate = values.interestRate
            ? Math.max(0, Number(values.interestRate.replace(",", ".")) || 0)
            : 0
        const liabilityType: LiabilityType | null = values.type === "payable"
            ? values.liabilityType || "other"
            : null
        const creditLimit = values.type === "payable" && values.liabilityType === "creditCard" && values.creditLimit
            ? parseInt(values.creditLimit.replace(/\D/g, ""), 10)
            : null
        const statementDay = values.type === "payable" && values.liabilityType === "creditCard" && values.statementDay
            ? Math.min(31, Math.max(1, parseInt(values.statementDay, 10)))
            : null
        const assetId = values.type === "payable" && values.assetId && values.assetId !== "none"
            ? values.assetId
            : null

        const debtData = {
            personName: values.personName,
            totalAmount: totalAmount,
            minimumPayment: minimumPayment,
            interestRate: interestRate,
            liabilityType: liabilityType,
            creditLimit: creditLimit,
            statementDay: statementDay,
            assetId: assetId,
            dueDate: values.dueDate ? values.dueDate.toISOString() : null,
            description: values.description
        }

        if (debt) {
            const paidAmount = debt.totalAmount - debt.remainingAmount
            const newRemaining = Math.max(0, totalAmount - paidAmount)

            await editDebt(debt.id, {
                ...debtData,
                remainingAmount: newRemaining,
                status: newRemaining <= 0 ? 'paid' : 'active'
            })
            setOpen(false)
            return
        }

        await addDebt({
            ...debtData,
            type: values.type
        }, user.uid)

        setOpen(false)
        form.reset()
    }

    function resetForm() {
        form.reset({
            type: debt?.type || "payable",
            personName: debt?.personName || "",
            amount: debt ? formatCurrencyInput(String(debt.totalAmount)) : "",
            minimumPayment: debt?.minimumPayment ? formatCurrencyInput(String(debt.minimumPayment)) : "",
            interestRate: debt?.interestRate ? String(debt.interestRate) : "",
            liabilityType: debt?.liabilityType || "other",
            creditLimit: debt?.creditLimit ? formatCurrencyInput(String(debt.creditLimit)) : "",
            statementDay: debt?.statementDay ? String(debt.statementDay) : "",
            assetId: debt?.assetId || "none",
            dueDate: debt?.dueDate ? new Date(debt.dueDate) : undefined,
            description: debt?.description || ""
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
                        <Plus className="mr-2 h-4 w-4" /> Add Record
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle>{debt ? "Edit Debt / Loan" : "Add Debt / Loan"}</DialogTitle>
                    <DialogDescription>
                        {debt ? "Update this debt record." : "Record money you owe or money owed to you."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!debt}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="payable">I Owe (Hutang)</SelectItem>
                                            <SelectItem value="receivable">Owed to Me (Piutang)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {isPayable && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="liabilityType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Liability Type</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value || "other"}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {LIABILITY_TYPES.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {LIABILITY_TYPE_LABELS[type]}
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
                                    name="assetId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Linked Asset (Optional)</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value || "none"}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="None" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {assets.map((asset) => (
                                                        <SelectItem key={asset.id} value={asset.id}>
                                                            {asset.name} ({asset.category})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}
                        <FormField
                            control={form.control}
                            name="personName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Person Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Budi, John" {...field} />
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
                                    <FormLabel>Total Amount</FormLabel>
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
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="minimumPayment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Minimum Payment</FormLabel>
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
                                name="interestRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Interest Rate (%)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {isCreditCard && (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="creditLimit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Credit Limit</FormLabel>
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
                                    name="statementDay"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Statement Day</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="31"
                                                    placeholder="e.g. 25"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                        <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Due Date (Optional)</FormLabel>
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
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Notes..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">{debt ? "Save Changes" : "Save Record"}</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
