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
import {
  EXPENSE_CATEGORY_GROUPS,
  getDefaultCategoryGroup,
  type CategoryGroup,
} from "@/lib/constants"
import { useState } from "react"
import { Trash2, Plus, Tags } from "lucide-react"

function groupLabel(group: string) {
  return group.charAt(0).toUpperCase() + group.slice(1)
}

export function CategoryManager() {
  const { categories, addCategory, editCategory, removeCategory } = useTransactionStore()
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)

  const [newCatName, setNewCatName] = useState("")
  const [newCatType, setNewCatType] = useState<"income" | "expense">("expense")
  const [newCatGroup, setNewCatGroup] = useState<CategoryGroup>("other")
  const [error, setError] = useState("")

  const handleAdd = async () => {
    const name = newCatName.trim()
    if (!user || !name) return

    const exists = categories.some(
      (category) => category.name.toLowerCase() === name.toLowerCase() && category.type === newCatType
    )

    if (exists) {
      setError("This category already exists.")
      return
    }

    setError("")
    await addCategory({
      name,
      type: newCatType,
      group: newCatType === "income" ? "income" : newCatGroup,
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
            Create custom categories and choose how they count toward spending.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1 sm:col-span-2">
                    <Label htmlFor="catName">Name</Label>
                    <Input
                        id="catName"
                        value={newCatName}
                        onChange={(e) => {
                            setNewCatName(e.target.value)
                            setError("")
                        }}
                        placeholder="e.g., Online Subscription"
                    />
                </div>
                <div className="grid gap-1">
                    <Label>Type</Label>
                     <Select
                        value={newCatType}
                        onValueChange={(v: "income" | "expense") => {
                            setNewCatType(v)
                            setNewCatGroup(v === "income" ? "income" : "other")
                            setError("")
                        }}
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
                <div className="grid gap-1">
                    <Label>Group</Label>
                    {newCatType === "expense" ? (
                      <Select
                        value={newCatGroup}
                        onValueChange={(value) => {
                          setNewCatGroup(value as CategoryGroup)
                          setError("")
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORY_GROUPS.map((group) => (
                            <SelectItem key={group} value={group}>
                              {groupLabel(group)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex h-9 items-center rounded-md border px-3 text-sm text-muted-foreground">
                        Income
                      </div>
                    )}
                </div>
            </div>

            <Button onClick={handleAdd} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>

            {error && (
                <p className="text-xs text-destructive">{error}</p>
            )}

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                <div className="text-sm font-medium text-muted-foreground mb-2">Your Categories</div>
                {categories.length === 0 && (
                    <div className="text-sm text-center py-4 text-muted-foreground italic">
                        No custom categories yet.
                    </div>
                )}
                {categories.map((cat) => (
                    <div key={cat.id} className="space-y-2 rounded-md border bg-muted/50 p-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${cat.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <span className="truncate text-sm font-medium">{cat.name}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removeCategory(cat.id)}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>

                        {cat.type === "expense" ? (
                            <Select
                                value={cat.group ?? getDefaultCategoryGroup(cat.name, "expense")}
                                onValueChange={(value) => editCategory(cat.id, { group: value as CategoryGroup })}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {EXPENSE_CATEGORY_GROUPS.map((group) => (
                                        <SelectItem key={group} value={group}>
                                            {groupLabel(group)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <span className="text-xs text-muted-foreground">Income category</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
