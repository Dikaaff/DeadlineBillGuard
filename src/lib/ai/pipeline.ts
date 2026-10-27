import { z } from "zod";
import type { BillCategory, CurrencyCode } from "@/lib/types";
import { addDaysISO, daysBetween, todayISO } from "@/lib/format";
import { heuristicExtract, sanitizeEmailText, type HeuristicResult, type RawEmail } from "./heuristic";
import {
  EMAIL_CLASSIFIER,
  buildExtractorSystem,
} from "./prompts";
import { completeJson, extractJsonObject } from "./provider";

const CURRENCY_WHITELIST: CurrencyCode[] = [
  "USD", "EUR", "GBP", "IDR", "SGD", "INR", "PHP", "AUD", "CAD", "MYR", "THB", "BRL", "MXN",
];

const CATEGORY_WHITELIST: BillCategory[] = [
  "utilities", "internet", "phone", "streaming", "saas", "insurance",
  "rent", "loan", "credit_card", "gym", "other",
];

const classifierSchema = z.object({
  is_bill: z.boolean(),
  is_billing_uncertain: z.boolean().optional().default(false),
});

const extractorSchema = z.object({
  merchant: z.string().min(1).max(120),
  amount_cents: z.number().int().nullable().optional(),
  currency: z.string().optional(),
  due_date: z.string().nullable().optional(),
  invoice_id: z.string().nullable().optional(),
  category: z.string().optional(),
  is_subscription_candidate: z.boolean().optional(),
  is_billing_uncertain: z.boolean().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export interface PipelineResult extends HeuristicResult {
  method: "llm" | "heuristic";
  provider: string | null;
  model: string | null;
  latencyMs: number;
  classifier: { isBill: boolean; uncertain: boolean } | null;
}

function guardrail(result: HeuristicResult): HeuristicResult {
  let confidence = result.confidence;
  let amountCents = result.amountCents;
  let dueDate = result.dueDate;

  if (amountCents !== null && (amountCents < 1 || amountCents > 10_000_000)) {
    amountCents = null;
    confidence -= 0.2;
  }
  if (dueDate) {
    const today = todayISO();
    const offset = daysBetween(today, dueDate);
    if (offset < -90 || offset > 400) {
      dueDate = null;
      confidence -= 0.2;
    }
  } else if (result.isBill) {
    confidence -= 0.2;
  }

  if (!CURRENCY_WHITELIST.includes(result.currency)) {
    result.currency = "USD";
    confidence -= 0.1;
  }
  if (!CATEGORY_WHITELIST.includes(result.category)) {
    result.category = "other";
  }

  return {
    ...result,
    amountCents,
    dueDate,
    confidence: Math.max(0.02, Math.min(0.99, Number(confidence.toFixed(2)))),
  };
}

function scoreAgainstHeuristic(
  llm: HeuristicResult,
  base: HeuristicResult,
): number {
  let confidence = llm.confidence;
  if (
    base.amountCents !== null &&
    llm.amountCents !== null &&
    Math.abs(base.amountCents - llm.amountCents) / Math.max(base.amountCents, 1) > 0.01
  ) {
    confidence -= 0.2;
  }
  if (!llm.dueDate && base.dueDate) {
    confidence -= 0.05;
  }
  return Math.max(0.02, Math.min(0.99, Number(confidence.toFixed(2))));
}

export async function processEmail(email: RawEmail): Promise<PipelineResult> {
  const startedAt = Date.now();
  const base = heuristicExtract(email);
  const body = sanitizeEmailText(`${email.subject}\n${email.text}`, 2000);

  let method: PipelineResult["method"] = "heuristic";
  let provider: string | null = null;
  let model: string | null = null;

  const classifierRaw = await completeJson({
    system: EMAIL_CLASSIFIER.system,
    user: `FROM: ${email.from}\nSUBJECT: ${email.subject}\nBODY:\n${body}`,
    temperature: EMAIL_CLASSIFIER.temperature,
    maxTokens: EMAIL_CLASSIFIER.maxTokens,
  });

  if (classifierRaw) {
    provider = classifierRaw.provider;
    model = classifierRaw.model;
    const parsed = classifierSchema.safeParse(extractJsonObject(classifierRaw.text));
    if (!parsed.success) {
      return withMeta(base, "heuristic", provider, model, null, startedAt);
    }
    if (!parsed.data.is_bill) {
      return withMeta(
        {
          ...base,
          isBill: false,
          amountCents: null,
          isBillingUncertain: false,
          confidence: 0.92,
        },
        "llm",
        provider,
        model,
        { isBill: false, uncertain: false },
        startedAt,
      );
    }
  }

  const extractorRaw = await completeJson({
    system: buildExtractorSystem(todayISO()),
    user: `FROM: ${email.from}\nSUBJECT: ${email.subject}\nBODY:\n${body}`,
    temperature: 0,
    maxTokens: 400,
  });

  if (!extractorRaw) {
    return withMeta(
      guardrail(base),
      method,
      provider,
      model,
      classifierRaw ? { isBill: true, uncertain: false } : null,
      startedAt,
    );
  }

  provider = extractorRaw.provider;
  model = extractorRaw.model;
  const parsed = extractorSchema.safeParse(extractJsonObject(extractorRaw.text));
  if (!parsed.success) {
    return withMeta(
      guardrail(base),
      "heuristic",
      provider,
      model,
      { isBill: true, uncertain: false },
      startedAt,
    );
  }

  const data = parsed.data;
  const currency = (data.currency ?? base.currency).toUpperCase() as CurrencyCode;
  const llmResult: HeuristicResult = {
    merchant: data.merchant === "UNKNOWN_MERCHANT" ? base.merchant : data.merchant,
    amountCents: data.amount_cents ?? base.amountCents,
    currency,
    dueDate: data.due_date ?? base.dueDate,
    invoiceId: data.invoice_id ?? base.invoiceId,
    category: (CATEGORY_WHITELIST.includes(data.category as BillCategory)
      ? (data.category as BillCategory)
      : base.category),
    isSubscriptionCandidate:
      data.is_subscription_candidate ?? base.isSubscriptionCandidate,
    isBillingUncertain: data.is_billing_uncertain ?? base.isBillingUncertain,
    confidence: scoreAgainstHeuristic(
      {
        ...base,
        confidence: data.confidence ?? base.confidence,
      },
      base,
    ),
    isBill: true,
    signals: base.signals,
  };

  method = "llm";
  return withMeta(
    guardrail(llmResult),
    method,
    provider,
    model,
    { isBill: true, uncertain: Boolean(data.is_billing_uncertain) },
    startedAt,
  );
}

function withMeta(
  result: HeuristicResult,
  method: PipelineResult["method"],
  provider: string | null,
  model: string | null,
  classifier: PipelineResult["classifier"],
  startedAt: number,
): PipelineResult {
  return {
    ...result,
    method,
    provider,
    model,
    classifier,
    latencyMs: Date.now() - startedAt,
  };
}

export { addDaysISO };
