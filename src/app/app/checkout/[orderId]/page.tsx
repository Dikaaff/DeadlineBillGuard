import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, LockIcon, ShieldCheckIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { approveCheckoutAction } from "@/lib/actions/bills";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/db/store";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage({ params }: { params: Promise<{ orderId: string }> }) {
  const user = await requireUser();
  const { orderId } = await params;
  const bill = await store.findBillByPaypalOrderId(orderId);
  if (!bill || bill.userId !== user.id) notFound();

  const simulated = orderId.startsWith("SIM-");
  const fee = Math.round(bill.amountCents * 0.0349) + 30;
  const total = bill.amountCents + (simulated ? 0 : fee);

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4 py-2">
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start text-muted-foreground">
        <Link href={`/app/bills/${bill.id}`}>
          <ArrowLeftIcon data-icon="inline-start" />
          Back to bill
        </Link>
      </Button>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between bg-[#003087] px-6 py-4 text-white">
          <span className="text-lg font-semibold italic tracking-tight">PayPal</span>
          <span className="flex items-center gap-1.5 text-xs opacity-80">
            <LockIcon className="size-3.5" />
            Secure checkout
          </span>
        </div>

        <div className="flex flex-col gap-5 px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Paying</p>
            <p className="mt-1 text-lg font-medium">{bill.merchant}</p>
            <p className="text-sm text-muted-foreground">
              Invoice {bill.invoiceId ?? "n/a"} · due {formatDate(bill.dueDate, "long")}
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="tabular font-display text-3xl">
                {formatMoney(total, bill.currency)}
              </span>
            </div>
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {simulated ? "No fee in demo mode" : `Includes ${formatMoney(fee, bill.currency)} processing fee`}
            </p>
          </div>

          {simulated ? (
            <Alert>
              <ShieldCheckIcon />
              <AlertTitle>Simulated PayPal sandbox</AlertTitle>
              <AlertDescription>
                No credentials configured, so this is the demo checkout. Approving records a
                simulated capture named <code className="font-mono text-xs">CAP-SIM-…</code> and
                marks the bill paid.
              </AlertDescription>
            </Alert>
          ) : null}

          <form action={approveCheckoutAction.bind(null, orderId)}>
            <Button
              type="submit"
              className="w-full bg-[#0070ba] text-white hover:bg-[#005ea6]"
              size="lg"
            >
              Approve payment of {formatMoney(total, bill.currency)}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            Cancel and you will return to the bill. Nothing is charged until you approve.
          </p>
        </div>
      </div>
    </div>
  );
}
