import { PiggyBankIcon, Repeat2Icon, SparklesIcon } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { setUsageAction } from "@/lib/actions/subscriptions";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/db/store";
import { yearlyEquivalent } from "@/lib/domain";
import { categoryLabel, formatDate, formatMoney } from "@/lib/format";
import type { Subscription, UsageStatus } from "@/lib/types";
import { cn } from "cn";

export const metadata = { title: "Subscriptions" };

const USAGE_OPTIONS: Array<{ value: UsageStatus; label: string }> = [
  { value: "used", label: "In use" },
  { value: "unknown", label: "Not sure" },
  { value: "unused", label: "Unused" },
];

function UsageControl({ subscription }: { subscription: Subscription }) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5">
      {USAGE_OPTIONS.map((option) => {
        const active = subscription.usageStatus === option.value;
        return (
          <form key={option.value} action={setUsageAction.bind(null, subscription.id, option.value)}>
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className={cn(
                "h-6 rounded px-2 text-[11px] font-medium",
                active
                  ? option.value === "unused"
                    ? "bg-destructive/10 text-destructive hover:bg-destructive/15"
                    : "bg-primary/10 text-primary hover:bg-primary/15"
                  : "text-muted-foreground",
              )}
            >
              {option.label}
            </Button>
          </form>
        );
      })}
    </div>
  );
}

export default async function SubscriptionsPage() {
  const user = await requireUser();
  const subscriptions = await store.listSubscriptions(user.id);

  const monthlyTotal = subscriptions
    .filter((s) => s.usageStatus !== "unused")
    .reduce((sum, s) => sum + s.avgAmountCents, 0);
  const unused = subscriptions.filter((s) => s.usageStatus === "unused");
  const savingsYearly = unused.reduce((sum, s) => sum + yearlyEquivalent(s), 0);

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Subscriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plans we detected from your bill history. Flag what you don&apos;t use and we&apos;ll total
          the leak.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <PiggyBankIcon className="size-3.5" />
              Recoverable per year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="tabular font-display text-4xl leading-none">
              {formatMoney(savingsYearly, "USD")}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              From {unused.length} flagged plan{unused.length === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Repeat2Icon className="size-3.5" />
              Tracked plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="tabular font-display text-4xl leading-none">{subscriptions.length}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">Across every billing cycle</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <SparklesIcon className="size-3.5" />
              Monthly committed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="tabular font-display text-4xl leading-none">
              {formatMoney(monthlyTotal, "USD")}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">Excludes plans you flagged unused</p>
          </CardContent>
        </Card>
      </div>

      {unused.length > 0 ? (
        <Card className="border-[color:var(--status-due-border)] bg-[color:var(--status-due-surface)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your cancel shortlist</CardTitle>
            <CardDescription>
              Start with the biggest yearly cost — cancel or downgrade, then mark it cancelled.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {unused
              .slice()
              .sort((a, b) => yearlyEquivalent(b) - yearlyEquivalent(a))
              .map((subscription) => (
                <div
                  key={subscription.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-background/70 px-3 py-2"
                >
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon category={subscription.category} />
                    <div>
                      <p className="text-sm font-medium">{subscription.merchant}</p>
                      <p className="text-xs text-muted-foreground">
                        {categoryLabel(subscription.category)} · every {subscription.cycleDays} days
                      </p>
                    </div>
                  </div>
                  <p className="tabular text-sm font-medium">
                    +{formatMoney(yearlyEquivalent(subscription), subscription.currency)}/yr
                  </p>
                </div>
              ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Plan</TableHead>
                <TableHead>Cycle</TableHead>
                <TableHead>Next charge</TableHead>
                <TableHead className="text-right">Per year</TableHead>
                <TableHead className="pr-5 text-right">Usage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={subscription.category} />
                      <div>
                        <p className="text-sm font-medium">{subscription.merchant}</p>
                        <p className="text-xs text-muted-foreground">
                          {subscription.createdCount} charges seen
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {subscription.cycleDays === 30
                        ? "Monthly"
                        : subscription.cycleDays === 7
                          ? "Weekly"
                          : subscription.cycleDays === 365
                            ? "Yearly"
                            : `${subscription.cycleDays}d`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(subscription.nextDueDate)}
                  </TableCell>
                  <TableCell className="tabular text-right text-sm">
                    {formatMoney(yearlyEquivalent(subscription), subscription.currency)}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <UsageControl subscription={subscription} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col divide-y divide-border md:hidden">
          {subscriptions.map((subscription) => (
            <div key={subscription.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CategoryIcon category={subscription.category} />
                  <div>
                    <p className="text-sm font-medium">{subscription.merchant}</p>
                    <p className="text-xs text-muted-foreground">
                      next {formatDate(subscription.nextDueDate)}
                    </p>
                  </div>
                </div>
                <p className="tabular text-sm font-medium">
                  {formatMoney(yearlyEquivalent(subscription), subscription.currency)}/yr
                </p>
              </div>
              <UsageControl subscription={subscription} />
            </div>
          ))}
        </div>
      </Card>

      <p className="text-xs text-muted-foreground">
        Subscriptions are inferred from recurring merchants.{" "}
        <Separator orientation="vertical" className="mx-1 inline-block h-3" /> Flagging a plan as
        unused never cancels it automatically — you stay in control.
      </p>
    </div>
  );
}
