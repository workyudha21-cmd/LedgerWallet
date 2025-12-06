import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTransactionStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { useState } from "react"
import { Trash2, Plus, Tags } from "lucide-react"

export function CategoryManager() {
  const { categories, addCategory, removeCategory } = useTransactionStore()
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  
  const [newCatName, setNewCatName] = useState("")
  const [newCatType, setNewCatType] = useState<"income" | "expense">("expense")

  const handleAdd = async () => {
    if (!user || !newCatName.trim()) return
    
    await addCategory({
        name: newCatName,
        type: newCatType
    }, user.uid)
    
    setNewCatName("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
            <Tags className="mr-2 h-4 w-4" />
            Manage Categories
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>
            Create custom categories for your transactions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
            <div className="flex items-end gap-2">
                <div className="grid gap-1 flex-1">
                    <Label htmlFor="catName">Name</Label>
                    <Input 
                        id="catName" 
                        value={newCatName} 
                        onChange={(e) => setNewCatName(e.target.value)} 
                        placeholder="e.g., Online Subscription"
                    />
                </div>
                <div className="grid gap-1 w-[110px]">
                    <Label>Type</Label>
                     <Select 
                        value={newCatType} 
                        onValueChange={(v: "income" | "expense") => setNewCatType(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
                <Button size="icon" onClick={handleAdd}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                <div className="text-sm font-medium text-muted-foreground mb-2">Your Categories</div>
                {categories.length === 0 && (
                    <div className="text-sm text-center py-4 text-muted-foreground italic">
                        No custom categories yet.
                    </div>
                )}
                {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/50">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${cat.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="text-sm font-medium">{cat.name}</span>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeCategory(cat.id)}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
