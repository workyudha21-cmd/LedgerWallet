import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { auth, googleProvider } from "@/lib/firebase"
import { signInWithPopup } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/lib/auth-store"
import { Wallet } from "lucide-react"

export function Login() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      setUser(result.user)
      navigate("/")
    } catch (error) {
      console.error("Login failed:", error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-[350px]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
             <div className="p-3 bg-primary rounded-full">
                <Wallet className="h-6 w-6 text-primary-foreground" />
             </div>
          </div>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Login to manage your finances</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleLogin}>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
