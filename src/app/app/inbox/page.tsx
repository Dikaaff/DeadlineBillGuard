import Link from "next/link";
import { ArrowUpRightIcon, CheckIcon, MailIcon, SparklesIcon, XIcon } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { IngestForm } from "@/components/ingest-form";
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
import { confirmIngestAction, discardIngestAction } from "@/lib/actions/bills";
import { ingestSampleAction } from "@/lib/actions/inbox";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/db/store";
import { formatDateTime, formatMoney } from "@/lib/format";
import { SAMPLE_EMAILS } from "@/lib/samples";
import type { CurrencyCode } from "@/lib/types";

export const metadata = { title: "Inbox" };

type IngestPayload = {
  merchant?: string;
  amount_cents?: number;
  currency?: CurrencyCode;
  due_date?: string;
};

const RESULT_STYLE: Record<string, string> = {
  bill: "border-[color:var(--status-paid-border)] bg-[color:var(--status-paid-surface)] text-[color:var(--status-paid)]",
  uncertain: "border-[color:var(--status-due-border)] bg-[color:var(--status-due-surface)] text-[color:var(--status-due)]",
  duplicate: "border-border bg-muted text-muted-foreground",
  ignored: "border-border bg-muted text-muted-foreground",
};

export default async function InboxPage() {
  const user = await requireUser();
  const [connection, ingests] = await Promise.all([
    store.getConnection(user.id),
    store.listIngests(user.id, 30),
  ]);

  const needsReview = ingests.filter((ingest) => ingest.result === "uncertain" && ingest.payload);

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every bill starts as an email. Forward it once — we read the amount, the due date and the
          invoice number.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MailIcon className="size-4 text-muted-foreground" />
              Your forwarding address
            </CardTitle>
            <CardDescription>
              Add this as a forwarding rule, or paste an email below to try it now.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
              <code className="min-w-0 flex-1 truncate font-mono text-sm">
                {connection?.address ?? "not-configured@inbox.billguard.app"}
              </code>
              <CopyButton value={connection?.address ?? ""} label="Copy address" />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[color:var(--status-paid)]" />
                {connection?.status ?? "active"}
              </span>
              <span>
                {connection?.lastSyncAt
                  ? `Last email ${formatDateTime(connection.lastSyncAt)}`
                  : "No email received yet"}
              </span>
            </div>
            <Separator />
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Try a real sample
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_EMAILS.map((sample) => (
                  <form key={sample.id} action={ingestSampleAction.bind(null, sample.id)}>
                    <Button type="submit" variant="outline" size="sm">
                      <SparklesIcon data-icon="inline-start" />
                      {sample.label}
                    </Button>
                  </form>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paste an email</CardTitle>
            <CardDescription>Runs the same pipeline as the inbound webhook.</CardDescription>
          </CardHeader>
          <CardContent>
            <IngestForm />
          </CardContent>
        </Card>
      </div>

      {needsReview.length > 0 ? (
        <Card className="border-[color:var(--status-due-border)]">
          <CardHeader>
            <CardTitle className="text-base">Needs your eyes ({needsReview.length})</CardTitle>
            <CardDescription>
              Extraction confidence landed under 60%. Confirm the numbers or discard the email.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {needsReview.map((ingest) => {
              const payload = (ingest.payload ?? {}) as IngestPayload;
              return (
                <div
                  key={ingest.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {payload.merchant ?? ingest.subject}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ingest.from} · {ingest.subject}
                    </p>
                    <p className="tabular mt-1 text-xs">
                      {payload.amount_cents
                        ? formatMoney(payload.amount_cents, payload.currency ?? "USD")
                        : "amount unknown"}{" "}
                      · due {payload.due_date ?? "unknown"} ·{" "}
                      {Math.round(ingest.confidence * 100)}% confident
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={confirmIngestAction.bind(null, ingest.id)}>
                      <Button type="submit" size="sm">
                        <CheckIcon data-icon="inline-start" />
                        Add bill
                      </Button>
                    </form>
                    <form action={discardIngestAction.bind(null, ingest.id)}>
                      <Button type="submit" size="sm" variant="ghost">
                        <XIcon data-icon="inline-start" />
                        Discard
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
          <p className="text-sm font-medium">Ingest log</p>
          <Badge variant="secondary" className="font-normal">
            {ingests.length} events
          </Badge>
        </div>
        {ingests.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No emails yet. Forward one to your address, or run a sample above.
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-5">Email</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="pr-5 text-right">Bill</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingests.map((ingest) => (
                    <TableRow key={ingest.id}>
                      <TableCell className="max-w-[340px] pl-5">
                        <p className="truncate text-sm font-medium">{ingest.subject}</p>
                        <p className="truncate text-xs text-muted-foreground">{ingest.from}</p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(ingest.receivedAt)}
                      </TableCell>
                      <TableCell className="tabular text-xs">
                        {Math.round(ingest.confidence * 100)}%
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${RESULT_STYLE[ingest.result] ?? RESULT_STYLE.ignored}`}
                        >
                          {ingest.result}
                        </span>
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        {ingest.billId ? (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/app/bills/${ingest.billId}`}>
                              Open
                              <ArrowUpRightIcon data-icon="inline-end" />
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col divide-y divide-border md:hidden">
              {ingests.map((ingest) => (
                <div key={ingest.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{ingest.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ingest.from} · {Math.round(ingest.confidence * 100)}%
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${RESULT_STYLE[ingest.result] ?? RESULT_STYLE.ignored}`}
                  >
                    {ingest.result}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
