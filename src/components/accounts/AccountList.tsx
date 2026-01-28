import { useTransactionStore } from "@/lib/store"
import { AccountCard } from "./AccountCard"
import { AddAccountDialog } from "./AddAccountDialog"

export function AccountList() {
  const { accounts, currency } = useTransactionStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Your Accounts</h2>
        <AddAccountDialog />
      </div>
      
      {accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/50">
              No accounts found. Create one to get started!
          </div>
      ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
                <AccountCard key={account.id} account={account} currency={currency} />
            ))}
          </div>
      )}
    </div>
  )
}
