import { Link } from "react-router-dom"
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  CreditCard,
  PieChart,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"
import { ModeToggle } from "@/components/mode-toggle"
import { Reveal } from "@/components/landing/Reveal"
import { Button } from "@/components/ui/button"

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  accent: string
}

const features: Feature[] = [
  {
    icon: Scale,
    title: "Net worth, connected",
    description: "Accounts, properties, vehicles, investments, and debts roll into one clear number.",
    accent: "from-indigo-500/15 to-indigo-500/5 text-indigo-500",
  },
  {
    icon: PieChart,
    title: "Budgets that make sense",
    description: "Set monthly limits, review the last six months, and see where your money actually goes.",
    accent: "from-emerald-500/15 to-emerald-500/5 text-emerald-500",
  },
  {
    icon: Target,
    title: "Goals with momentum",
    description: "Fund goals from your accounts and watch progress grow without mixing savings into expenses.",
    accent: "from-purple-500/15 to-purple-500/5 text-purple-500",
  },
  {
    icon: CreditCard,
    title: "Debt payoff clarity",
    description: "Track principal and interest, link housing payments to a mortgage, and see the finish line.",
    accent: "from-orange-500/15 to-orange-500/5 text-orange-500",
  },
  {
    icon: TrendingUp,
    title: "A health score that helps",
    description: "Six practical metrics turn your cash flow, debt, and emergency fund into a score with next steps.",
    accent: "from-cyan-500/15 to-cyan-500/5 text-cyan-500",
  },
  {
    icon: BarChart3,
    title: "Reports you can share",
    description: "Monthly breakdowns, category totals, and clean CSV or PDF exports whenever you need them.",
    accent: "from-rose-500/15 to-rose-500/5 text-rose-500",
  },
]

const steps = [
  {
    title: "Create your account",
    description: "Sign up with email or Google. Your dashboard is private to you from the first click.",
  },
  {
    title: "Add your accounts and assets",
    description: "Start with cash, bank, or wallet balances, then add property, vehicles, and investments.",
  },
  {
    title: "See the whole picture",
    description: "Record transactions and transfers while net worth, budgets, and financial health stay in sync.",
  },
]

const benefits = [
  {
    title: "Accounts and assets stay separate",
    description: "Cash stays spendable, while houses and vehicles live in net worth where they belong.",
  },
  {
    title: "Savings do not distort your income",
    description: "Goal and asset contributions are treated as savings, not expenses or income.",
  },
  {
    title: "Debt payments show real progress",
    description: "Interest is an expense; principal reduces the balance. You see both clearly.",
  },
  {
    title: "Your data is yours to keep",
    description: "Download a JSON backup or export your transactions as CSV or PDF at any time.",
  },
]

const faqs = [
  {
    question: "Is LedgerWallet free to start?",
    answer: "Yes. Create an account and start tracking your money without a credit card.",
  },
  {
    question: "Does it support IDR and USD?",
    answer: "Yes. Choose your currency before adding data. Once you have financial data, the currency is locked so existing amounts are not relabeled.",
  },
  {
    question: "Can I track assets, debts, and recurring payments?",
    answer: "Yes. Keep property and vehicles in Assets, track payables and receivables in Debts, and link recurring rules to a debt, asset, or goal.",
  },
  {
    question: "Can I export my data?",
    answer: "Yes. Export transactions as CSV or PDF, and download a full JSON backup from Settings.",
  },
  {
    question: "How private is my data?",
    answer: "Your Firestore data is scoped to your signed-in account with owner-only rules. There are no ads or third-party trackers in the app.",
  },
]

function MockDashboard() {
  const bars = [35, 58, 44, 72, 55, 84, 62, 92]

  return (
    <div
      className="relative mx-auto w-full max-w-[540px] animate-fade-up"
      style={{ animationDelay: "220ms" }}
      aria-hidden="true"
    >
      <div
        className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-emerald-500/20 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative rounded-[1.75rem] border border-border/80 bg-card/90 p-4 shadow-2xl shadow-indigo-500/10 backdrop-blur sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live overview
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Net worth</p>
            <p className="text-2xl font-bold tracking-tight sm:text-3xl">Rp 482.750.000</p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
            +12.4%
          </span>
        </div>

        <div className="mt-5 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-emerald-500 p-4 text-white shadow-lg shadow-indigo-500/20">
          <div className="flex items-center justify-between text-xs text-white/80">
            <span>Monthly cash flow</span>
            <span>+ Rp 4.250.000</span>
          </div>
          <div className="mt-4 flex h-20 items-end gap-1.5">
            {bars.map((height, index) => (
              <div
                key={`${height}-${index}`}
                className="flex-1 rounded-t-sm bg-white/80 transition-all duration-500 hover:bg-white"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-white/70">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-background/60 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              Cash &amp; bank
            </div>
            <p className="mt-1.5 text-sm font-semibold">Rp 27.400.000</p>
          </div>
          <div className="rounded-xl border bg-background/60 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Financial health
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <p className="text-sm font-semibold">82 / 100</p>
              <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600">
                Excellent
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {[
            { label: "Salary", amount: "+ Rp 12.000.000", color: "bg-emerald-500" },
            { label: "Groceries", amount: "- Rp 325.000", color: "bg-rose-500" },
            { label: "Mortgage principal", amount: "- Rp 1.570.000", color: "bg-indigo-500" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border bg-background/50 px-3 py-2 text-xs">
              <span className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
                {item.label}
              </span>
              <span className={item.amount.startsWith("+") ? "text-emerald-600" : "text-muted-foreground"}>
                {item.amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -left-4 top-1/3 hidden w-40 animate-float rounded-xl border bg-card p-3 shadow-xl sm:block">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-indigo-500" />
          <div>
            <p className="text-[9px] text-muted-foreground">Goal progress</p>
            <p className="text-xs font-semibold">Emergency fund</p>
          </div>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-muted">
          <div className="h-1.5 w-[68%] rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" />
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">68% funded</p>
      </div>

      <div className="absolute -right-3 bottom-20 hidden w-36 animate-float-slow rounded-xl border bg-card p-3 shadow-xl sm:block">
        <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Debt payoff</p>
        <p className="mt-1 text-xs font-semibold">On track</p>
        <p className="text-[10px] text-muted-foreground">Est. 2029</p>
      </div>
    </div>
  )
}

export function Landing() {
  const user = useAuthStore((state) => state.user)
  const primaryTo = user ? "/dashboard" : "/login"
  const primaryLabel = user ? "Open your dashboard" : "Start for free"

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-white shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
              <Wallet className="h-5 w-5" />
            </span>
            <span className="hidden text-lg font-bold tracking-tight min-[360px]:inline">LedgerWallet</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <ModeToggle />
            </div>
            {!user && (
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/login">Sign in</Link>
              </Button>
            )}
            <Button
              asChild
              className="bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-emerald-400"
            >
              <Link to={primaryTo}>
                {user ? "Dashboard" : "Get started"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <div className="animate-blob absolute left-1/2 top-0 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="animate-blob animation-delay-2000 absolute -left-24 top-40 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="animate-blob animation-delay-4000 absolute -right-24 top-24 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
          </div>

          <div className="mx-auto grid max-w-7xl gap-16 px-4 pb-24 pt-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:pt-28">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Personal finance, simplified
              </div>

              <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
                Your money,{" "}
                <span className="animate-gradient bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-fuchsia-400 dark:to-emerald-400">
                  finally in focus.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                Track accounts, assets, debts, budgets, and goals in one private dashboard.
                Understand your net worth and financial health without the spreadsheet fatigue.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-emerald-400"
                >
                  <Link to={primaryTo}>
                    {primaryLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#features">See what&apos;s inside</a>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["Free to start", "Private by design", "Mobile ready"].map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <MockDashboard />
          </div>
        </section>

        <section className="border-y bg-muted/20">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
            {[
              { value: "1", label: "dashboard for your whole financial life" },
              { value: "6", label: "metrics behind your health score" },
              { value: "IDR / USD", label: "clear local currency formatting" },
              { value: "Private", label: "owner-only data access" },
            ].map((stat) => (
              <div key={stat.value}>
                <p className="text-xl font-bold tracking-tight sm:text-2xl">{stat.value}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">Everything in one place</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              A clearer picture of your financial life.
            </h2>
            <p className="mt-4 text-muted-foreground">
              One place for the numbers that matter, with the context to act on them.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Reveal key={feature.title} delay={index * 60}>
                  <div className="group h-full rounded-2xl border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/5">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-base font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </section>

        <section id="how-it-works" className="border-y bg-muted/20 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-500">How it works</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                From scattered numbers to a plan you can follow.
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <Reveal key={step.title} delay={index * 80}>
                  <div className="relative h-full rounded-2xl border bg-card p-6">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/10 text-sm font-bold text-indigo-500">
                      {index + 1}
                    </span>
                    <h3 className="mt-5 text-base font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-24">
          <div className="absolute -right-20 top-20 -z-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500">Built for real life</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Money clarity without the busywork.
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                LedgerWallet keeps the boring parts organized, so you can spend your attention on the decisions that matter.
              </p>

              <div className="mt-8 space-y-5">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="h-3 w-3 text-emerald-600" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{benefit.title}</p>
                      <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={140} className="relative">
              <div className="rounded-3xl border bg-card p-6 shadow-xl shadow-indigo-500/5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">Private by design</p>
                    <p className="text-xs text-muted-foreground">Your account, your data.</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    "Owner-only Firestore access",
                    "JSON backup whenever you want",
                    "CSV and PDF export",
                    "No ads or third-party trackers",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-lg border bg-background/50 px-3 py-2.5 text-sm">
                      <Check className="h-4 w-4 text-emerald-500" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-emerald-500 p-4 text-white">
                  <p className="text-xs text-white/80">Your financial health</p>
                  <div className="mt-1 flex items-end justify-between">
                    <p className="text-3xl font-bold">82</p>
                    <span className="rounded-full bg-white/15 px-2 py-1 text-[10px]">Excellent</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/20">
                    <div className="h-2 w-[82%] rounded-full bg-white" />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-2 hidden animate-float rounded-xl border bg-card px-3 py-2 text-xs font-medium shadow-lg sm:block">
                Net worth +12.4%
              </div>
            </Reveal>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-500">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Questions, answered.</h2>
          </Reveal>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, index) => (
              <Reveal key={faq.question} delay={index * 50}>
                <details className="group rounded-xl border bg-card p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <ChevronDown className="faq-chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform" />
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-indigo-500 to-emerald-500 px-6 py-16 text-center text-white shadow-2xl shadow-indigo-500/20 sm:px-12">
            <div className="absolute -left-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to see your money clearly?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-white/80">
              Start with your accounts today. Your future self will thank you for the clarity.
            </p>
            <Button
              asChild
              size="lg"
              className="relative mt-8 bg-white text-slate-900 shadow-lg hover:bg-white/90"
            >
              <Link to={primaryTo}>
                {user ? "Open your dashboard" : "Create your free account"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 text-white">
              <Wallet className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">LedgerWallet</span>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
            {!user && <Link to="/login" className="transition-colors hover:text-foreground">Sign in</Link>}
            {user && <Link to="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link>}
          </div>

          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} LedgerWallet. Built for clearer money decisions.
          </p>
        </div>
      </footer>
    </div>
  )
}
