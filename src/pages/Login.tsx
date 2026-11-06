import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth, googleProvider } from "@/lib/firebase"
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/lib/auth-store"
import { Wallet, CheckCircle2, Loader2 } from "lucide-react"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { useEffect, useState } from "react"

type LoginMode = "signin" | "signup" | "reset"

function getAuthErrorMessage(code: string) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password."
    case "auth/email-already-in-use":
      return "An account with this email already exists."
    case "auth/weak-password":
      return "Password must be at least 6 characters."
    case "auth/invalid-email":
      return "Enter a valid email address."
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later."
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled."
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled in Firebase."
    default:
      return "Authentication failed. Please try again."
  }
}

export function Login() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const user = useAuthStore((state) => state.user)

  const [mode, setMode] = useState<LoginMode>("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (user) navigate("/", { replace: true })
  }, [user, navigate])

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode)
    setError("")
    setMessage("")
    setPassword("")
    setConfirmPassword("")
  }

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setMessage("")

    const trimmedEmail = email.trim()

    if (!trimmedEmail.includes("@")) {
      setError("Enter a valid email address.")
      return
    }

    if (mode !== "reset" && password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Enter your name.")
        return
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.")
        return
      }
    }

    setLoading(true)

    try {
      if (mode === "signin") {
        const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password)
        setUser(credential.user)
        navigate("/")
      } else if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password)
        await updateProfile(credential.user, { displayName: name.trim() })
        setUser(auth.currentUser ?? credential.user)
        navigate("/")
      } else {
        await sendPasswordResetEmail(auth, trimmedEmail)
        setMessage("Password reset email sent. Check your inbox.")
        setMode("signin")
      }
    } catch (error) {
      const code = (error as { code?: string }).code
      setError(code ? getAuthErrorMessage(code) : "Authentication failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const result = await signInWithPopup(auth, googleProvider)
      setUser(result.user)
      navigate("/")
    } catch (error) {
      const code = (error as { code?: string }).code
      setError(code ? getAuthErrorMessage(code) : "Google sign-in failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const title = mode === "signup"
    ? "Create an account"
    : mode === "reset"
      ? "Reset your password"
      : "Welcome back"

  const subtitle = mode === "signup"
    ? "Sign up with your email to get started"
    : mode === "reset"
      ? "Enter your email to receive a reset link"
      : "Sign in with your email or Google account"

  return (
    <div className="relative min-h-screen flex-col items-center justify-center grid md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <AnimatedBackground />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Wallet className="mr-2 h-6 w-6" />
          Ledger Wallet
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;This app has completely transformed how I manage my expenses. The budgeting tools and debt tracker are lifesavers.&rdquo;
            </p>
            <footer className="text-sm">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>
      <div className="p-4 lg:p-8 flex items-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="grid gap-5">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              {mode !== "reset" && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    disabled={loading}
                  />
                </div>
              )}

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
              )}

              {mode === "signin" && (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => switchMode("reset")}
                >
                  Forgot password?
                </button>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
              {message && <p className="text-sm text-emerald-600">{message}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
              </Button>
            </form>

            {mode !== "reset" && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with Google
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleLogin}
                  className="py-6"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                  )}
                  Continue with Google
                </Button>
              </>
            )}

            <p className="text-center text-sm text-muted-foreground">
              {mode === "signin" && (
                <>
                  Don&apos;t have an account?{" "}
                  <button type="button" className="text-primary hover:underline" onClick={() => switchMode("signup")}>
                    Create one
                  </button>
                </>
              )}
              {mode === "signup" && (
                <>
                  Already have an account?{" "}
                  <button type="button" className="text-primary hover:underline" onClick={() => switchMode("signin")}>
                    Sign in
                  </button>
                </>
              )}
              {mode === "reset" && (
                <button type="button" className="text-primary hover:underline" onClick={() => switchMode("signin")}>
                  Back to sign in
                </button>
              )}
            </p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Features included
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Real-time Expense Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Financial Goals & Budgeting</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Debt Management</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Export to CSV/PDF</span>
              </div>
            </div>
          </div>

          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
