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
import { useTransactionStore } from "@/lib/store"
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
import { PlusCircle, CalendarIcon } from "lucide-react"
import { formatCurrencyInput, cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  targetAmount: z.string().refine((val) => {
    const num = parseInt(val.replace(/\D/g, ""), 10)
    return !isNaN(num) && num > 0
  }, "Target amount must be greater than 0"),
  deadline: z.date().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function AddGoalDialog() {
  const [open, setOpen] = useState(false)
  const { addGoal } = useTransactionStore()
  const user = useAuthStore((state) => state.user)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      targetAmount: "",
      deadline: undefined
    },
  })

  async function onSubmit(values: FormValues) {
    if (!user) return
    
    const amount = parseInt(values.targetAmount.replace(/\D/g, ""), 10)
    
    await addGoal({
      name: values.name,
      targetAmount: amount,
      currentAmount: 0,
      deadline: values.deadline ? values.deadline.toISOString() : undefined,
    }, user.uid)
    
    setOpen(false)
    form.reset()
  }

  return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Goal
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Financial Goal</DialogTitle>
            <DialogDescription>
              Set a target for your savings.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. New Laptop, Vacation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Amount</FormLabel>
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
                name="deadline"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Deadline (Optional)</FormLabel>
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
              <Button type="submit" className="w-full">Create Goal</Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
  )
}
