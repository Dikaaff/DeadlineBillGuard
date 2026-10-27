import { processEmail, type PipelineResult } from "@/lib/ai/pipeline";
import type { RawEmail } from "@/lib/ai/heuristic";
import { store } from "@/lib/db/store";
import type { Bill } from "@/lib/types";

export interface IngestOutcome {
  outcome: "bill" | "ignored" | "uncertain" | "duplicate";
  bill: Bill | null;
  pipeline: PipelineResult | null;
}

export async function ingestEmail(input: {
  userId: string;
  email: RawEmail;
  messageId: string | null;
}): Promise<IngestOutcome> {
  const { userId, email, messageId } = input;

  if (messageId) {
    const existing = await store.findBillByMessageId(userId, messageId);
    if (existing) {
      await store.logIngest({
        userId,
        messageId,
        from: email.from,
        subject: email.subject,
        result: "duplicate",
        confidence: 1,
        billId: existing.id,
        payload: null,
      });
      return { outcome: "duplicate", bill: existing, pipeline: null };
    }
  }

  const pipeline = await processEmail(email);
  const payload = {
    merchant: pipeline.merchant,
    amount_cents: pipeline.amountCents,
    currency: pipeline.currency,
    due_date: pipeline.dueDate,
    invoice_id: pipeline.invoiceId,
    category: pipeline.category,
    is_subscription_candidate: pipeline.isSubscriptionCandidate,
    confidence: pipeline.confidence,
    method: pipeline.method,
    provider: pipeline.provider,
    model: pipeline.model,
    latency_ms: pipeline.latencyMs,
    signals: pipeline.signals,
  };

  const isActionable =
    pipeline.isBill &&
    pipeline.amountCents !== null &&
    pipeline.amountCents > 0 &&
    pipeline.dueDate !== null &&
    pipeline.confidence >= 0.6;

  if (!isActionable) {
    const outcome: IngestOutcome["outcome"] = pipeline.isBillingUncertain
      ? "uncertain"
      : "ignored";
    await store.logIngest({
      userId,
      messageId,
      from: email.from,
      subject: email.subject,
      result: outcome,
      confidence: pipeline.confidence,
      billId: null,
      payload,
    });
    return { outcome, bill: null, pipeline };
  }

  const bill = await store.createBill(userId, {
    merchant: pipeline.merchant ?? "Unknown merchant",
    category: pipeline.category,
    amountCents: pipeline.amountCents!,
    currency: pipeline.currency,
    dueDate: pipeline.dueDate!,
    invoiceId: pipeline.invoiceId,
    sourceMessageId: messageId,
    rawSnippet: email.text.slice(0, 500),
    extractionConfidence: pipeline.confidence,
    isSubscription: pipeline.isSubscriptionCandidate,
  });

  await store.ensureRemindersForBill(userId, bill);
  await store.logIngest({
    userId,
    messageId,
    from: email.from,
    subject: email.subject,
    result: "bill",
    confidence: pipeline.confidence,
    billId: bill.id,
    payload,
  });

  return { outcome: "bill", bill, pipeline };
}
