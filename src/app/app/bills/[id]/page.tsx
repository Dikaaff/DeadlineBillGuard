import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  BellRingIcon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  MailIcon,
  PencilIcon,
  RefreshCwIcon,
  Trash2Icon,
} from "lucide-react";
import { BillStatusBadge } from "@/components/bill-status-badge";
import { CategoryIcon } from "@/components/category-icon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  deleteBillAction,
  markPaidManuallyAction,
  reopenBillAction,
  startCheckoutAction,
} from "@/lib/actions/bills";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/db/store";
import { getBillContext, yearlyEquivalent } from "@/lib/domain";
import {
  categoryLabel,
  dueLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  formatMoneyWhole,
} from "@/lib/format";

export const metadata = { title: "Bill" };

const OFFSET_LABEL: Record<number, string> = {
  7: "One week before",
  3: "Three days before",
  1: "Day before",
  0: "Due date",
};

export default async function BillDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const context = await getBillContext(user.id, id);
  if (!context) notFound();

  const { bill, reminders, subscription } = context;
  const paypalEvents = await store.listPaypalEventsForBill(user.id, bill.id);
  const isPaid = bill.status === "paid";
  const isOverdue = bill.status === "overdue";

  const flash =
    query.paypal === "success"
      ? { tone: "success" as const, title: "Payment captured", body: "PayPal confirmed the payment and the bill is marked paid." }
      : query.paypal === "already-paid"
        ? { tone: "muted" as const, title: "Already paid", body: "This bill was captured earlier — no second charge was made." }
        : query.saved
          ? { tone: "muted" as const, title: "Changes saved", body: "Reminders were recalculated from the new due date." }
          : null;

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon-sm" className="mt-0.5 text-muted-foreground">
            <Link href="/app/bills" aria-label="Back to bills">
              <ArrowLeftIcon />
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-[-0.02em]">{bill.merchant}</h1>
              <BillStatusBadge bill={bill} />
              {bill.isSubscription ? (
                <Badge variant="outline" className="font-normal">
                  Recurring
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>{categoryLabel(bill.category)}</span>
              <span aria-hidden>·</span>
              <span>Due {formatDate(bill.dueDate, "long")}</span>
              <span aria-hidden>·</span>
              <span>{dueLabel(bill.dueDate, bill.status)}</span>
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/app/bills/${bill.id}/edit`}>
            <PencilIcon data-icon="inline-start" />
            Edit
          </Link>
        </Button>
      </div>

      {flash ? (
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>{flash.title}</AlertTitle>
          <AlertDescription>{flash.body}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-5">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border/70 bg-muted/30 px-6 py-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Amount due
                </p>
                <p className="tabular mt-1 font-display text-[clamp(2.2rem,5vw,3rem)] leading-none tracking-tight">
                  {formatMoney(bill.amountCents, bill.currency)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Invoice {bill.invoiceId ?? "not provided"}
                </p>
              </div>
              <CategoryIcon category={bill.category} />
            </div>

            <CardContent className="flex flex-col gap-4 pt-6">
              {!isPaid ? (
                <div className="flex flex-wrap gap-2">
                  <form action={startCheckoutAction.bind(null, bill.id)}>
                    <Button type="submit" className="bg-[#0070ba] text-white hover:bg-[#005ea6]">
                      <CircleDollarSignIcon data-icon="inline-start" />
                      Pay {formatMoneyWhole(bill.amountCents, bill.currency)} with PayPal
                    </Button>
                  </form>
                  <form action={markPaidManuallyAction.bind(null, bill.id)}>
                    <Button type="submit" variant="outline">
                      <CheckCircle2Icon data-icon="inline-start" />
                      Mark as paid
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[color:var(--status-paid-border)] bg-[color:var(--status-paid-surface)] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Paid {bill.paidAt ? formatDateTime(bill.paidAt) : ""}</p>
                    <p className="text-xs text-muted-foreground">
                      Capture {bill.paypalCaptureId ?? "manual"} · order {bill.paypalOrderId ?? "n/a"}
                    </p>
                  </div>
                  <form action={reopenBillAction.bind(null, bill.id)}>
                    <Button type="submit" variant="outline" size="sm">
                      <RefreshCwIcon data-icon="inline-start" />
                      Reopen
                    </Button>
                  </form>
                </div>
              )}

              {isOverdue ? (
                <Alert variant="destructive">
                  <BellRingIcon />
                  <AlertTitle>This bill is past due</AlertTitle>
                  <AlertDescription>
                    Late fees start compounding. Pay now, or reschedule the due date if the merchant
                    agreed to an extension.
                  </AlertDescription>
                </Alert>
              ) : null}

              <Separator />

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Due date</dt>
                  <dd className="mt-0.5">{formatDate(bill.dueDate, "long")}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Category</dt>
                  <dd className="mt-0.5">{categoryLabel(bill.category)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Added</dt>
                  <dd className="mt-0.5">{formatDateTime(bill.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Extraction confidence</dt>
                  <dd className="mt-0.5 tabular">{Math.round(bill.extractionConfidence * 100)}%</dd>
                </div>
              </dl>

              <div className="flex justify-end border-t border-border/60 pt-3">
                <form action={deleteBillAction.bind(null, bill.id)}>
                  <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2Icon data-icon="inline-start" />
                    Delete bill
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {bill.rawSnippet ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MailIcon className="size-4 text-muted-foreground" />
                  Source email
                </CardTitle>
                <CardDescription>What the parser read, so you can audit the numbers.</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/60 p-3 text-xs leading-relaxed">
                  {bill.rawSnippet}
                </pre>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CircleDollarSignIcon className="size-4 text-muted-foreground" />
                PayPal activity
              </CardTitle>
              <CardDescription>
                Orders, captures and webhook reconciliations recorded for this bill.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-0">
              {paypalEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No PayPal events yet. Start a checkout to see the order and capture trail.
                </p>
              ) : (
                paypalEvents.map((event, index) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="mt-1.5 size-2.5 rounded-full bg-[#0070ba]" />
                      {index < paypalEvents.length - 1 ? (
                        <span className="my-1 w-px flex-1 bg-border" />
                      ) : null}
                    </div>
                    <div className="pb-4">
                      <p className="font-mono text-xs font-medium">{event.eventType}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(event.receivedAt)} · {event.eventId}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BellRingIcon className="size-4 text-muted-foreground" />
                Reminders
              </CardTitle>
              <CardDescription>Automatic nudges before the money leaves your account.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-0">
              {reminders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reminders scheduled.</p>
              ) : (
                reminders.map((reminder, index) => (
                  <div key={reminder.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={
                          reminder.sentAt
                            ? "mt-1.5 size-2.5 rounded-full bg-primary"
                            : "mt-1.5 size-2.5 rounded-full border-2 border-muted-foreground/40"
                        }
                      />
                      {index < reminders.length - 1 ? (
                        <span className="my-1 w-px flex-1 bg-border" />
                      ) : null}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">{OFFSET_LABEL[reminder.offsetDays]}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(reminder.sendAt, "long")} ·{" "}
                        {reminder.sentAt ? `sent ${formatDateTime(reminder.sentAt)}` : "scheduled"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {subscription ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subscription signal</CardTitle>
                <CardDescription>
                  This bill matches a plan you already track.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Monthly</span>
                  <span className="tabular font-medium">
                    {formatMoney(subscription.avgAmountCents, subscription.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Yearly</span>
                  <span className="tabular font-medium">
                    {formatMoney(yearlyEquivalent(subscription), subscription.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Charges tracked</span>
                  <span className="tabular">{subscription.createdCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Usage</span>
                  <Badge variant={subscription.usageStatus === "unused" ? "destructive" : "secondary"} className="font-normal">
                    {subscription.usageStatus}
                  </Badge>
                </div>
                <Button asChild variant="outline" size="sm" className="mt-1">
                  <Link href="/app/subscriptions">Review subscriptions</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
