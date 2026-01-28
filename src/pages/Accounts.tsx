import { AccountList } from "@/components/accounts/AccountList"

export function Accounts() {
  return (
    <div className="flex-1 space-y-4">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
      </div>
      <AccountList />
    </div>
  )
}
