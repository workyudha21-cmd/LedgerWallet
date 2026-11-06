import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTransactionStore } from "@/lib/store"
import { Coins, Lock } from "lucide-react"

interface CurrencyToggleProps {
  disabled?: boolean
}

export function CurrencyToggle({ disabled = false }: CurrencyToggleProps) {
  const { currency, setCurrency } = useTransactionStore()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          disabled={disabled}
          title={disabled ? "Currency is locked while financial data exists" : undefined}
        >
            <Coins className="mr-2 h-4 w-4" />
            {currency}
            {disabled && <Lock className="ml-auto h-3 w-3" />}
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
