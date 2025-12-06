import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTransactionStore } from "@/lib/store"
import { Coins } from "lucide-react"

export function CurrencyToggle() {
  const { currency, setCurrency } = useTransactionStore()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start">
            <Coins className="mr-2 h-4 w-4" />
            {currency}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setCurrency("IDR")}>
          IDR (Rupiah)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrency("USD")}>
          USD (Dollar)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
