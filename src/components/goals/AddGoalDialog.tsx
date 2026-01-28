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
import { PlusCircle } from "lucide-react"
import { formatCurrencyInput } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  targetAmount: z.string().refine((val) => {
    const num = parseInt(val.replace(/\D/g, ""), 10)
    return !isNaN(num) && num > 0
  }, "Target amount must be greater than 0"),
  deadline: z.string().optional(),
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
      deadline: ""
    },
  })

  async function onSubmit(values: FormValues) {
    if (!user) return
    
    const amount = parseInt(values.targetAmount.replace(/\D/g, ""), 10)
    
    await addGoal({
      name: values.name,
      targetAmount: amount,
      currentAmount: 0,
      deadline: values.deadline || undefined,
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
                    <FormItem>
                        <FormLabel>Deadline (Optional)</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
                        </FormControl>
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
