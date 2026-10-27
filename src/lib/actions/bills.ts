"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { appUrl } from "@/lib/app-url";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/db/store";
import { addDaysISO, todayISO } from "@/lib/format";
import { capturePaypalOrder, createPaypalOrder } from "@/lib/paypal";
import type { BillCategory, CurrencyCode } from "@/lib/types";

const CATEGORIES: BillCategory[] = [
  "utilities", "internet", "phone", "streaming", "saas", "insurance",
  "rent", "loan", "credit_card", "gym", "other",
];

const CURRENCIES: CurrencyCode[] = [
  "USD", "EUR", "GBP", "IDR", "SGD", "INR", "PHP", "AUD", "CAD", "MYR", "THB", "BRL", "MXN",
];

const billFormSchema = z.object({
  merchant: z.string().trim().min(2, "Merchant is required").max(120),
  amount: z.string().trim().min(1, "Amount is required"),
  currency: z.enum(CURRENCIES as [CurrencyCode, ...CurrencyCode[]]),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a due date"),
  category: z.enum(CATEGORIES as [BillCategory, ...BillCategory[]]),
  invoiceId: z.string().trim().max(60).optional(),
  isSubscription: z.boolean().optional(),
});

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(/,/g, "");
  const number = Number(cleaned);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error("Enter a valid amount greater than zero.");
  }
  return Math.round(number * 100);
}

function readBillForm(formData: FormData) {
  const parsed = billFormSchema.parse({
    merchant: String(formData.get("merchant") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? "USD"),
    dueDate: String(formData.get("dueDate") ?? ""),
    category: String(formData.get("category") ?? "other"),
    invoiceId: String(formData.get("invoiceId") ?? ""),
    isSubscription: formData.get("isSubscription") === "on",
  });
  return {
    merchant: parsed.merchant,
    amountCents: parseAmount(parsed.amount),
    currency: parsed.currency,
    dueDate: parsed.dueDate,
    category: parsed.category,
    invoiceId: parsed.invoiceId || null,
    isSubscription: Boolean(parsed.isSubscription),
  };
}

export interface BillFormState {
  error: string | null;
}

export async function saveBillAction(
  billId: string | null,
  _prev: BillFormState,
  formData: FormData,
): Promise<BillFormState> {
  const user = await requireUser();
  let target: string;

  try {
    const input = readBillForm(formData);
    const status = input.dueDate < todayISO() ? "overdue" : "pending";

    if (billId) {
      const updated = await store.updateBill(user.id, billId, { ...input, status });
      if (!updated) return { error: "That bill no longer exists." };
      target = `/app/bills/${billId}?saved=1`;
    } else {
      const bill = await store.createBill(user.id, {
        ...input,
        extractionConfidence: 1,
        rawSnippet: null,
        sourceMessageId: null,
        status,
      });
      await store.ensureRemindersForBill(user.id, bill);
      target = `/app/bills/${bill.id}`;
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not save this bill. Check the fields and try again.",
    };
  }

  revalidatePath("/app");
  revalidatePath("/app/bills");
  if (billId) revalidatePath(`/app/bills/${billId}`);
  redirect(target);
}

export async function markPaidManuallyAction(billId: string): Promise<void> {
  const user = await requireUser();
  await store.markBillPaid(user.id, billId, null, null);
  revalidatePath("/app");
  revalidatePath("/app/bills");
  revalidatePath(`/app/bills/${billId}`);
}

export async function reopenBillAction(billId: string): Promise<void> {
  const user = await requireUser();
  const bill = await store.getBill(user.id, billId);
  if (!bill) return;
  await store.updateBill(user.id, billId, {
    status: bill.dueDate < todayISO() ? "overdue" : "pending",
    paidAt: null,
    paypalCaptureId: null,
  });
  revalidatePath("/app");
  revalidatePath("/app/bills");
  revalidatePath(`/app/bills/${billId}`);
}

export async function deleteBillAction(billId: string): Promise<void> {
  const user = await requireUser();
  await store.deleteBill(user.id, billId);
  revalidatePath("/app");
  revalidatePath("/app/bills");
  redirect("/app/bills");
}

export async function startCheckoutAction(billId: string): Promise<void> {
  const user = await requireUser();
  const bill = await store.getBill(user.id, billId);
  if (!bill) redirect("/app/bills");
  if (bill.status === "paid") redirect(`/app/bills/${bill.id}?paypal=already-paid`);

  const order = await createPaypalOrder(bill, { appUrl: appUrl() });
  await store.setPaypalOrder(user.id, bill.id, order.id);
  await store.logPaypalEvent({
    eventId: `create-${order.id}`,
    eventType: "ORDER.CREATED",
    billId: bill.id,
    payload: { mode: order.mode, orderId: order.id },
  });
  redirect(order.approveUrl);
}

export async function approveCheckoutAction(orderId: string): Promise<void> {
  const user = await requireUser();
  const bill = await store.findBillByPaypalOrderId(orderId);
  if (!bill || bill.userId !== user.id) redirect("/app/bills");

  const capture = await capturePaypalOrder(orderId);
  await store.markBillPaid(user.id, bill.id, capture.captureId, orderId);
  await store.logPaypalEvent({
    eventId: `capture-${capture.captureId}`,
    eventType: "PAYMENT.CAPTURE.COMPLETED",
    billId: bill.id,
    payload: {
      orderId,
      captureId: capture.captureId,
      status: capture.status,
      amount: (bill.amountCents / 100).toFixed(2),
      currency: bill.currency,
    },
  });
  revalidatePath("/app");
  revalidatePath("/app/bills");
  revalidatePath(`/app/bills/${bill.id}`);
  redirect(`/app/bills/${bill.id}?paypal=success`);
}

export async function confirmIngestAction(ingestId: string): Promise<void> {
  const user = await requireUser();
  const ingest = await store.getIngest(user.id, ingestId);
  if (!ingest?.payload) return;

  const payload = ingest.payload as {
    merchant?: string;
    amount_cents?: number;
    currency?: CurrencyCode;
    due_date?: string;
    invoice_id?: string;
    category?: BillCategory;
    is_subscription_candidate?: boolean;
    confidence?: number;
  };

  if (!payload.amount_cents || !payload.due_date) {
    redirect("/app/inbox?error=missing-fields");
  }

  const bill = await store.createBill(user.id, {
    merchant: payload.merchant ?? "Unknown merchant",
    amountCents: payload.amount_cents,
    currency: payload.currency ?? "USD",
    dueDate: payload.due_date ?? addDaysISO(todayISO(), 7),
    invoiceId: payload.invoice_id ?? null,
    category: payload.category ?? "other",
    isSubscription: Boolean(payload.is_subscription_candidate),
    extractionConfidence: Math.min(payload.confidence ?? 0.5, 0.8),
    rawSnippet: null,
    sourceMessageId: ingest.messageId,
  });
  await store.ensureRemindersForBill(user.id, bill);
  await store.updateIngest(user.id, ingestId, { result: "bill", billId: bill.id });
  revalidatePath("/app");
  revalidatePath("/app/inbox");
  redirect(`/app/bills/${bill.id}`);
}

export async function discardIngestAction(ingestId: string): Promise<void> {
  const user = await requireUser();
  await store.updateIngest(user.id, ingestId, { result: "ignored" });
  revalidatePath("/app/inbox");
}
