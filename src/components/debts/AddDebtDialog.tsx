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
import { useTransactionStore } from "@/lib/store"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Textarea } from "@/components/ui/textarea"

const formSchema = z.object({
    type: z.enum(["payable", "receivable"]),
    personName: z.string().min(2, "Name must be at least 2 characters"),
    amount: z.string().refine((val) => {
        const num = parseInt(val.replace(/\D/g, ""), 10)
        return !isNaN(num) && num > 0
    }, "Amount must be greater than 0"),
    dueDate: z.date().optional(),
    description: z.string().optional()
})

type FormValues = z.infer<typeof formSchema>

export function AddDebtDialog() {
    const [open, setOpen] = useState(false)
    const user = useAuthStore((state) => state.user)
    const addDebt = useTransactionStore((state) => state.addDebt)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: "payable",
            personName: "",
            amount: "",
            dueDate: undefined,
            description: ""
        },
    })

    async function onSubmit(values: FormValues) {
        if (!user) return

        const totalAmount = parseInt(values.amount.replace(/\D/g, ""), 10)

        await addDebt({
            type: values.type,
            personName: values.personName,
            totalAmount: totalAmount,
            dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
            description: values.description
        }, user.uid)

        setOpen(false)
        form.reset()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Record
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Debt / Loan</DialogTitle>
                    <DialogDescription>
                        Record money you owe or money owed to you.
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Button type="submit" className="w-full">Save Record</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
