import Link from "next/link";
import {
  ArrowUpRight,
  BellRing,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Inbox as InboxIcon,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { BillStatusBadge } from "@/components/bill-status-badge";
import { CategoryIcon } from "@/components/category-icon";
import { Runway } from "@/components/runway";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { startCheckoutAction } from "@/lib/actions/bills";
import { requireUser } from "@/lib/auth";
import { getDashboard } from "@/lib/domain";
import {
  categoryLabel,
  dueLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  formatMoneyWhole,
} from "@/lib/format";

export const metadata = { title: "Overview" };

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboard(user.id);
  const { stats, nextBill, insights } = data;

  const upcoming = data.bills
    .filter((bill) => bill.status !== "paid" && bill.status !== "cancelled")
    .slice(0, 6);

  const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date());

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          }).format(new Date())}
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">
          Welcome back, {user.name.split(" ")[0]}.
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        {nextBill ? (
          <section className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-panel p-6 text-panel-foreground shadow-sm ring-1 ring-white/10 sm:p-7">
            <div className="pointer-events-none absolute inset-0 grain opacity-20" />
            <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-sidebar-primary/15 blur-2xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-panel-foreground/60">Next bill due</p>
                <div className="mt-2 flex items-center gap-2.5">
                  <h2 className="font-display text-3xl sm:text-4xl">{nextBill.merchant}</h2>
                </div>
                <p className="mt-1.5 text-sm text-panel-foreground/65">
                  {categoryLabel(nextBill.category)} · {dueLabel(nextBill.dueDate, nextBill.status)}
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-white/15 bg-white/5 text-panel-foreground/75"
              >
                {formatDate(nextBill.dueDate, "long")}
              </Badge>
            </div>

            <div className="relative mt-8 flex flex-wrap items-end justify-between gap-5">
              <p className="font-display tabular text-5xl leading-none sm:text-6xl">
                {formatMoney(nextBill.amountCents, nextBill.currency)}
              </p>
              <div className="flex items-center gap-2">
                <form action={startCheckoutAction.bind(null, nextBill.id)}>
                  <Button
                    type="submit"
                    variant="secondary"
                    className="bg-white text-panel hover:bg-white/90"
                  >
                    Pay with PayPal
                  </Button>
                </form>
                <Button
                  asChild
                  variant="ghost"
                  className="text-panel-foreground/80 hover:bg-white/10 hover:text-panel-foreground"
                >
                  <Link href={`/app/bills/${nextBill.id}`}>
                    Details
                    <ChevronRight data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <Card className="justify-center">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Sparkles />
                </EmptyMedia>
                <EmptyTitle>No open bills</EmptyTitle>
                <EmptyDescription>
                  Forward a bill to your inbox address and it will show up here within seconds.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Stat
            label="Due in 7 days"
            value={formatMoneyWhole(stats.dueSoonCents)}
            hint={`${stats.dueSoonCount} bill${stats.dueSoonCount === 1 ? "" : "s"}`}
            icon={<Clock3 />}
          />
          <Stat
            label="Overdue"
            value={formatMoneyWhole(stats.overdueCents)}
            hint={`${stats.overdueCount} bill${stats.overdueCount === 1 ? "" : "s"}`}
            icon={<TriangleAlert />}
            tone={stats.overdueCount > 0 ? "danger" : "default"}
          />
          <Stat
            label={`Paid in ${monthName}`}
            value={formatMoneyWhole(stats.paidThisMonthCents)}
            hint={`${formatMoneyWhole(stats.monthTotalCents)} total due`}
            icon={<CircleDollarSign />}
          />
          <Stat
            label="Subscriptions"
            value={formatMoneyWhole(stats.subscriptionMonthlyCents)}
            hint="per month"
            icon={<BellRing />}
          />
        </div>
      </div>

      <Runway days={data.runway} />

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <Card className="gap-0">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
            <div>
              <CardTitle>Upcoming bills</CardTitle>
              <CardDescription>Sorted by due date. Nothing is hidden.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/bills">
                All bills
                <ChevronRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardHeader>
          <Separator />
          <div className="flex flex-col">
            {upcoming.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                Everything is paid. Enjoy the quiet.
              </p>
            ) : (
              upcoming.map((bill) => (
                <Link
                  key={bill.id}
                  href={`/app/bills/${bill.id}`}
                  className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50"
                >
                  <CategoryIcon category={bill.category} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{bill.merchant}</p>
                      {bill.isSubscription ? (
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                          Recurring
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {categoryLabel(bill.category)} · {dueLabel(bill.dueDate, bill.status)}
                    </p>
                  </div>
                  <BillStatusBadge bill={bill} className="hidden sm:inline-flex" />
                  <p className="tabular w-24 text-right text-sm font-medium">
                    {formatMoney(bill.amountCents, bill.currency)}
                  </p>
                  <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          {insights.length > 0 ? (
            <Card className="border-status-due/30 bg-status-due-surface/70">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-status-due" />
                  <CardTitle className="font-display text-xl">
                    {formatMoneyWhole(stats.savingsYearlyCents)} a year is sitting idle
                  </CardTitle>
                </div>
                <CardDescription>
                  {insights.length} subscription{insights.length === 1 ? "" : "s"} you flagged as
                  unused. Double-check before cancelling.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {insights.slice(0, 3).map((insight) => (
                  <div key={insight.subscription.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{insight.subscription.merchant}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{insight.reason}</p>
                    </div>
                    <p className="tabular shrink-0 text-sm text-status-due">
                      {formatMoney(insight.monthlyCents, insight.subscription.currency)}/mo
                    </p>
                  </div>
                ))}
              </CardContent>
              <CardFooter className="border-status-due/20 bg-status-due/5">
                <Button asChild variant="outline" size="sm" className="w-full bg-background/60">
                  <Link href="/app/subscriptions">
                    Review subscriptions
                    <ArrowUpRight data-icon="inline-end" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ) : null}

          <Card className="gap-0">
            <CardHeader className="pb-3">
              <CardTitle>Reminders queued</CardTitle>
              <CardDescription>Email at 9:00 on each scheduled day.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="flex flex-col gap-3 pt-4">
              {data.reminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No reminders queued. We will create them automatically when a bill arrives.
                </p>
              ) : (
                data.reminders.map((reminder) => {
                  const bill = data.bills.find((item) => item.id === reminder.billId);
                  if (!bill) return null;
                  return (
                    <Link
                      key={reminder.id}
                      href={`/app/bills/${bill.id}`}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{bill.merchant}</span>
                        <span className="text-xs text-muted-foreground">
                          H-{reminder.offsetDays} · {formatDateTime(reminder.sendAt)}
                        </span>
                      </span>
                      <span className="tabular text-xs text-muted-foreground">
                        {formatMoney(bill.amountCents, bill.currency)}
                      </span>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="gap-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Inbox activity</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/app/inbox">
                    Open
                    <ChevronRight data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="flex flex-col gap-3 pt-4">
              {data.ingests.slice(0, 3).map((ingest) => (
                <div key={ingest.id} className="flex items-start gap-2.5">
                  <InboxIcon className="mt-0.5 size-3.5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{ingest.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {ingest.result === "bill"
                        ? "Added to bills"
                        : ingest.result === "uncertain"
                          ? "Needs review"
                          : ingest.result === "duplicate"
                            ? "Duplicate skipped"
                            : "Not a bill"}{" "}
                      · {Math.round(ingest.confidence * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <Card size="sm" className="justify-between gap-3">
      <CardContent className="flex items-start justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span
          className={
            tone === "danger"
              ? "text-status-overdue [&_svg]:size-4"
              : "text-muted-foreground/70 [&_svg]:size-4"
          }
        >
          {icon}
        </span>
      </CardContent>
      <CardContent className="mt-auto">
        <p className="tabular text-2xl font-semibold tracking-[-0.02em]">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
