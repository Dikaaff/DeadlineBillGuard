import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon, CheckCircle2Icon, PlayIcon } from "lucide-react";
import { Logo } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { demoSignInAction } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Sign in" };

const PROOF = [
  "12 bills and 5 subscriptions preloaded",
  "Simulated PayPal capture, end to end",
  "AI parser with offline fallback",
];

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/app");

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-panel p-10 text-panel-foreground lg:flex">
        <div className="pointer-events-none absolute -right-24 top-10 size-96 rounded-full bg-white/[0.03] blur-2xl" />
        <Link href="/" className="flex items-center gap-2.5 text-panel-foreground/90">
          <Logo />
        </Link>

        <div className="relative max-w-md">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-panel-foreground/45">
            Deadline Bill Guard
          </p>
          <h1 className="mt-4 text-4xl font-display leading-[1.05] tracking-[-0.02em]">
            The bill arrives.
            <br />
            You already handled it.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-panel-foreground/60">
            Sign in with any email to start clean, or jump straight into the seeded demo where the
            whole flow is wired.
          </p>

          <ul className="mt-8 space-y-3">
            {PROOF.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-panel-foreground/75">
                <CheckCircle2Icon className="size-4 text-[color:var(--status-paid)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-panel-foreground/35">
          No bank connection. No card required. Demo data resets on demand.
        </p>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 lg:justify-end">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground lg:hidden">
            <ArrowLeftIcon className="size-4" />
            Back
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeftIcon data-icon="inline-start" />
                Back to site
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-16 pt-4">
          <div className="w-full max-w-sm">
            <div className="lg:hidden">
              <Logo />
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-[-0.02em] lg:mt-0">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              One email is all it takes. No password.
            </p>

            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Demo workspace</CardTitle>
                <CardDescription>
                  Preloaded with overdue bills, reminders and ingest history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={demoSignInAction}>
                  <Button type="submit" className="w-full" size="lg">
                    <PlayIcon data-icon="inline-start" />
                    Enter the demo
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <Separator className="flex-1" />
              or use your own email
              <Separator className="flex-1" />
            </div>

            <LoginForm />

            <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
              By continuing you agree that this is a hackathon demo. Data stays in the local store
              and can be deleted from Settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
