import Link from "next/link";
import {
  ArrowRightIcon,
  BellRingIcon,
  CheckCircle2Icon,
  MailIcon,
  ScanLineIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WalletIcon,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { ThemeToggle } from "@/components/theme-toggle";

const STEPS = [
  {
    step: "01",
    title: "Forward the email",
    body: "One rule sends every invoice to your private address. No bank logins, no scraping.",
    icon: MailIcon,
  },
  {
    step: "02",
    title: "We read the bill",
    body: "Merchant, amount, due date, invoice number — parsed and scored for confidence.",
    icon: ScanLineIcon,
  },
  {
    step: "03",
    title: "Pay or get nudged",
    body: "Four reminders before the deadline, then one-tap PayPal checkout when you are ready.",
    icon: BellRingIcon,
  },
];

const FEATURES = [
  {
    title: "Extraction you can audit",
    body: "Every parsed field keeps its source snippet and confidence score. Under 60% goes to a human queue instead of quietly guessing.",
    icon: SparklesIcon,
  },
  {
    title: "A reminder ladder, not a snooze",
    body: "H-7, H-3, H-1 and H-0 notifications written like a friend who remembers your rent is due.",
    icon: BellRingIcon,
  },
  {
    title: "Checkout inside the bill",
    body: "PayPal Orders v2 captures the payment and reconciles it automatically. Simulated sandbox works with zero credentials.",
    icon: WalletIcon,
  },
  {
    title: "The subscription leak radar",
    body: "We group recurring merchants, then total what the plans you never use cost per year.",
    icon: ShieldCheckIcon,
  },
];

const FAQ = [
  {
    q: "Do I have to hand over bank credentials?",
    a: "No. Bill Guard only reads forwarded email and never asks for a bank login. Payments happen through PayPal's own checkout.",
  },
  {
    q: "What happens when the AI is unsure?",
    a: "Anything under 60% confidence lands in the review queue with the parsed fields pre-filled. You confirm or discard — nothing is created silently.",
  },
  {
    q: "Is this a real product or a demo?",
    a: "This build runs on a seeded demo store and a simulated PayPal sandbox by default. Add Groq and PayPal keys to switch the same code paths to live APIs.",
  },
  {
    q: "Where does my data live?",
    a: "In a file-backed JSON store on the server (`.data/` by default) so the demo needs no database. Point DBG_DATA_DIR at a persistent volume when you deploy.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#savings" className="transition-colors hover:text-foreground">Savings</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">
                Open the demo
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_70%_0%,color-mix(in_oklab,var(--primary)_9%,transparent),transparent_70%)]" />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-[color:var(--status-due)]" />
                Built for people with too many bills and no calendar discipline
              </span>
              <h1 className="mt-6 text-[clamp(2.9rem,6.2vw,4.8rem)] font-display leading-[0.95] tracking-[-0.025em]">
                Never eat a
                <span className="relative mx-2 inline-block">
                  <span className="relative z-10 italic">late fee</span>
                  <span className="absolute inset-x-0 bottom-1 z-0 h-3 bg-[color:var(--status-due)]/25" />
                </span>
                again.
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Forward your bills to one address. Bill Guard reads the amount and due date,
                reminds you before it hurts, and lets you pay without leaving the page.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg">
                  <Link href="/login">
                    Try the live demo
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-card/60 px-3 py-2">
                  <code className="font-mono text-xs text-muted-foreground">
                    raka.k7f2@inbox.billguard.app
                  </code>
                  <CopyButton value="raka.k7f2@inbox.billguard.app" label="Copy" className="h-7 px-2 text-xs" />
                </div>
              </div>

              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-border/70 pt-6">
                {[
                  { value: "$214", label: "average late fee avoided" },
                  { value: "4", label: "nudges per bill" },
                  { value: "94%", label: "fields extracted clean" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt className="tabular font-display text-3xl leading-none">{stat.value}</dt>
                    <dd className="mt-1.5 text-xs leading-snug text-muted-foreground">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute -left-3 top-6 z-20 hidden rotate-[-3deg] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm sm:flex">
                <BellRingIcon className="size-4 text-[color:var(--status-due)]" />
                <div>
                  <p className="text-xs font-medium">Reminder · 3 days before</p>
                  <p className="text-[11px] text-muted-foreground">PG&amp;E · $142.86</p>
                </div>
              </div>

              <div className="absolute -right-2 bottom-10 z-20 hidden rotate-[2deg] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm sm:flex">
                <CheckCircle2Icon className="size-4 text-[color:var(--status-paid)]" />
                <div>
                  <p className="text-xs font-medium">Paid with PayPal</p>
                  <p className="text-[11px] text-muted-foreground">captured in 2.1s</p>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[360px] rotate-[-1.5deg] rounded-xl border border-border bg-card p-6 shadow-[0_24px_60px_-30px_rgba(13,22,38,0.35)]">
                <div className="flex items-start justify-between border-b border-dashed border-border pb-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Statement · Oct 2026
                    </p>
                    <p className="mt-1 text-sm font-medium">Pacific Gas &amp; Electric</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px]">DUE</Badge>
                </div>
                <div className="py-6">
                  <p className="text-xs text-muted-foreground">Amount due</p>
                  <p className="tabular font-display text-6xl leading-none tracking-tight">$142.86</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Due <span className="font-medium text-foreground">Nov 6, 2026</span> · Account
                    4412-8891
                  </p>
                </div>
                <div className="space-y-2 border-t border-dashed border-border pt-4 text-[11px] text-muted-foreground">
                  <div className="flex justify-between"><span>Electric usage</span><span className="tabular">$118.40</span></div>
                  <div className="flex justify-between"><span>Taxes &amp; fees</span><span className="tabular">$18.46</span></div>
                  <div className="flex justify-between"><span>Late fee if missed</span><span className="tabular text-[color:var(--status-overdue)]">$12.00</span></div>
                </div>
                <div className="mt-5 flex h-7 items-end gap-[3px] opacity-40" aria-hidden>
                  {Array.from({ length: 42 }).map((_, index) => (
                    <span
                      key={index}
                      className="w-[2px] bg-foreground"
                      style={{ height: `${30 + ((index * 37) % 70)}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="absolute inset-x-6 -bottom-6 -z-10 h-24 rounded-xl border border-border/60 bg-muted/50" />
            </div>
          </div>
        </section>

        <section id="how" className="border-y border-border/70 bg-card/50">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Three moves
                </p>
                <h2 className="mt-3 max-w-lg text-3xl font-display leading-tight tracking-[-0.02em] sm:text-4xl">
                  Set it up once, forget the spreadsheet forever.
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                No bank connection. No monthly export. The inbox you already use becomes the source
                of truth.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {STEPS.map((step) => (
                <div key={step.step} className="group relative rounded-xl border border-border bg-background p-6">
                  <span className="font-mono text-[11px] text-muted-foreground">{step.step}</span>
                  <step.icon className="mt-6 size-6 text-primary" />
                  <h3 className="mt-4 text-base font-medium">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Under the hood
              </p>
              <h2 className="mt-3 text-3xl font-display leading-tight tracking-[-0.02em] sm:text-4xl">
                An email goes in.
                <br />
                A structured bill comes out.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                A versioned prompt classifies the message, a second extracts the fields, and a
                deterministic parser cross-checks both. Low confidence never becomes a silent bill.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["zod validated", "prompt v2.1", "heuristic fallback", "audit trail"].map((tag) => (
                  <span key={tag} className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  inbound.eml
                </p>
                <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
{`From: billing@pge.com
Subject: Your PG&E statement is ready

Your statement is ready.
Amount due: $142.86
Payment due date: November 6, 2026
Account number: 4412-8891`}
                </pre>
              </div>
              <div className="rounded-xl border border-primary/25 bg-[color-mix(in_oklab,var(--primary)_6%,var(--card))] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    extracted.json
                  </p>
                  <Badge className="h-5 bg-[color:var(--status-paid-surface)] px-1.5 font-mono text-[10px] text-[color:var(--status-paid)] hover:bg-[color:var(--status-paid-surface)]">
                    0.97
                  </Badge>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
{`{
  "merchant": "PG&E",
  "amount_cents": 14286,
  "currency": "USD",
  "due_date": "2026-11-06",
  "invoice_id": "4412-8891",
  "category": "utilities",
  "is_subscription": false
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section id="savings" className="border-y border-border/70 bg-background">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[1fr_1fr] lg:items-center lg:py-24">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                The quiet leak
              </p>
              <h2 className="mt-3 text-3xl font-display leading-tight tracking-[-0.02em] sm:text-4xl">
                Late fees are loud.
                <br />
                Forgotten subscriptions are not.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                Bill Guard groups recurring merchants and asks one honest question: do you still
                use this? Flag it once and see the yearly total you could recover.
              </p>
              <Button asChild size="lg" className="mt-7">
                <Link href="/login">
                  See your own leak
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <p className="text-sm font-medium">Flagged as unused</p>
                <Badge className="bg-[color:var(--status-due)]/20 font-normal text-[color:var(--status-due)] hover:bg-[color:var(--status-due)]/20">
                  3 plans
                </Badge>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  ["Adobe Creative Cloud", "$59.99/mo", "$719.88"],
                  ["LA Fitness", "$34.99/mo", "$419.88"],
                  ["Notion Plus", "$12.00/mo", "$144.00"],
                ].map(([name, monthly, yearly]) => (
                  <div key={name} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{monthly}</p>
                    </div>
                    <p className="tabular font-mono text-sm text-[color:var(--status-due)]">+{yearly}/yr</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Recoverable</p>
                <p className="tabular font-display text-4xl leading-none">$1,283.76</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="max-w-md text-3xl font-display leading-tight tracking-[-0.02em] sm:text-4xl">
              Small app. Sharp edges where it counts.
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              The parts that usually get hand-waved, built properly.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex gap-4 rounded-xl border border-border bg-card p-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-medium">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="border-t border-border/70 bg-card/40">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[0.7fr_1.3fr] lg:py-24">
            <div>
              <h2 className="text-3xl font-display leading-tight tracking-[-0.02em]">Fair questions</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Still curious? The demo is one click away.
              </p>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium">
                    {item.q}
                    <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-20">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-card px-6 py-10 sm:flex-row sm:items-center lg:px-10">
            <div>
              <h2 className="text-3xl font-display leading-tight tracking-[-0.02em]">
                Your next late fee is optional.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The demo is preloaded with bills, reminders and a payment flow. No signup.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/login">
                Open the demo
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-5 py-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="text-xs text-muted-foreground">Bills, guarded.</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">Demo</Link>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <span>Built for the Skills Idea Hackathon</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
