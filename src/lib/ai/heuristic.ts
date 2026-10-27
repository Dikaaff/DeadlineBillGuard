import type { BillCategory, CurrencyCode } from "@/lib/types";
import { addDaysISO, todayISO } from "@/lib/format";

export interface RawEmail {
  from: string;
  subject: string;
  text: string;
  receivedAt?: string;
}

export interface ExtractedBill {
  merchant: string | null;
  amountCents: number | null;
  currency: CurrencyCode;
  dueDate: string | null;
  invoiceId: string | null;
  category: BillCategory;
  isSubscriptionCandidate: boolean;
  isBillingUncertain: boolean;
  confidence: number;
}

export interface HeuristicResult extends ExtractedBill {
  isBill: boolean;
  signals: string[];
}

const CURRENCY_SYMBOLS: Record<string, CurrencyCode> = {
  $: "USD",
  "€": "EUR",
  "£": "GBP",
  "₹": "INR",
  "₱": "PHP",
  "฿": "THB",
  "Rp": "IDR",
};

const KNOWN_MERCHANTS: Array<{ match: RegExp; name: string; category?: BillCategory }> = [
  { match: /pge|pacificgas/i, name: "Pacific Gas & Electric", category: "utilities" },
  { match: /xfinity|comcast/i, name: "Comcast Xfinity", category: "internet" },
  { match: /netflix/i, name: "Netflix", category: "streaming" },
  { match: /spotify/i, name: "Spotify Premium", category: "streaming" },
  { match: /adobe/i, name: "Adobe Creative Cloud", category: "saas" },
  { match: /verizon/i, name: "Verizon Wireless", category: "phone" },
  { match: /statefarm|state-farm/i, name: "State Farm", category: "insurance" },
  { match: /chase/i, name: "Chase Sapphire", category: "credit_card" },
  { match: /notion/i, name: "Notion Plus", category: "saas" },
  { match: /planetfitness|planet-fitness/i, name: "Planet Fitness", category: "gym" },
  { match: /att\.com|at&t/i, name: "AT&T", category: "phone" },
  { match: /tmobile|t-mobile/i, name: "T-Mobile", category: "phone" },
  { match: /disneyplus|disney\+/i, name: "Disney+", category: "streaming" },
  { match: /hulu/i, name: "Hulu", category: "streaming" },
  { match: /github/i, name: "GitHub", category: "saas" },
  { match: /figma/i, name: "Figma", category: "saas" },
  { match: /openai/i, name: "OpenAI", category: "saas" },
  { match: /dropbox/i, name: "Dropbox", category: "saas" },
  { match: /water/i, name: "City Water District", category: "utilities" },
];

const CATEGORY_KEYWORDS: Array<{ category: BillCategory; match: RegExp }> = [
  { category: "utilities", match: /electric|gas bill|water|sewer|utility|energy|power bill/i },
  { category: "internet", match: /internet|broadband|fiber|wifi|xfinity/i },
  { category: "phone", match: /wireless|mobile|telecom|cell phone|phone bill/i },
  { category: "streaming", match: /streaming|netflix|spotify|hulu|disney|hbo|prime video/i },
  { category: "saas", match: /software|saas|creative cloud|subscription plan|workspace|license/i },
  { category: "insurance", match: /insurance|policy|premium|coverage/i },
  { category: "rent", match: /\brent\b|lease|apartment|property management/i },
  { category: "loan", match: /loan|mortgage|installment|emi\b/i },
  { category: "credit_card", match: /credit card|card statement|minimum payment|statement balance/i },
  { category: "gym", match: /gym|fitness|membership/i },
];

const BILL_CUES = [
  /amount due/i,
  /total due/i,
  /balance due/i,
  /payment due/i,
  /amount payable/i,
  /next charge/i,
  /will be charged/i,
  /renews?( at| for| on)?\s*\$?/i,
  /invoice/i,
  /statement/i,
  /payment failed/i,
  /late fee/i,
  /premium of/i,
  /minimum payment/i,
];

const NEGATIVE_CUES = [
  /has shipped/i,
  /out for delivery/i,
  /welcome to/i,
  /verify your (email|account)/i,
  /newsletter/i,
  /thanks for your (order|payment|purchase)/i,
  /payment (received|complete)/i,
  /receipt/i,
  /registration/i,
  /unsubscribe/i,
  /% off/i,
  /save \d/i,
  /sale ends/i,
];

const DUE_KEYWORDS =
  /(due|amount due|total due|balance|payment|next charge|renews?|pay by|payable|invoice)/i;

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&zwnj;/gi, "")
    .replace(/&[a-z]+;/gi, " ");
}

export function sanitizeEmailText(html: string, limit = 6000): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, limit);
}

function senderDomain(from: string): string {
  const match = from.match(/@([a-z0-9.-]+)/i);
  return (match?.[1] ?? "").toLowerCase();
}

function senderName(from: string): string | null {
  const match = from.match(/^\s*"?([^"<@]+?)"?\s*</);
  if (!match) return null;
  const name = match[1].trim();
  if (!name || /no.?reply|support|billing|notification|info|hello|team/i.test(name)) {
    return null;
  }
  return name.length <= 40 ? name : null;
}

function detectMerchant(email: RawEmail, haystack: string): { name: string | null; known: boolean } {
  const domain = senderDomain(email.from);
  const fingerprint = `${email.from} ${email.subject} ${domain}`;
  for (const entry of KNOWN_MERCHANTS) {
    if (entry.match.test(fingerprint)) return { name: entry.name, known: true };
  }

  const subjectMatch = haystack.match(
    /(?:your|from)\s+([A-Z][A-Za-z0-9&.+'’ -]{2,32}?)\s+(?:bill|invoice|statement|receipt|subscription|account|policy|plan)\b/i,
  );
  if (subjectMatch) return { name: subjectMatch[1].trim(), known: false };

  const name = senderName(email.from);
  if (name) return { name, known: false };

  const base = domain
    .replace(/^www\./, "")
    .split(".")[0]
    ?.replace(/[-_]+/g, " ")
    .trim();
  if (base && !["mail", "email", "billing", "notifications", "info"].includes(base)) {
    return { name: base.replace(/\b\w/g, (c) => c.toUpperCase()), known: false };
  }
  return { name: null, known: false };
}

interface MoneyCandidate {
  cents: number;
  currency: CurrencyCode;
  index: number;
  raw: string;
  score: number;
}

function toCents(raw: string): number | null {
  let value = raw.trim();
  if (/^\d{1,3}(\.\d{3})+$/.test(value)) {
    value = value.replace(/\./g, "");
  } else if (/^\d{1,3}(,\d{3})+$/.test(value)) {
    value = value.replace(/,/g, "");
  } else if (value.includes(",") && !value.includes(".")) {
    value = value.replace(",", ".");
  } else {
    value = value.replace(/,/g, "");
  }
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const cents = Math.round(number * 100);
  if (cents < 1 || cents > 10_000_000) return null;
  return cents;
}

function findAmountCandidates(text: string): MoneyCandidate[] {
  const candidates: MoneyCandidate[] = [];
  const symbols = /(?:^|[\s(])([$€£₹₱฿])\s?(\d[\d.,]*)/g;
  let match: RegExpExecArray | null;
  while ((match = symbols.exec(text)) !== null) {
    const cents = toCents(match[2]);
    if (cents === null) continue;
    candidates.push({
      cents,
      currency: CURRENCY_SYMBOLS[match[1]] ?? "USD",
      index: match.index,
      raw: match[0].trim(),
      score: 0,
    });
  }

  const rupiah = /\bRp\.?\s?(\d[\d.,]*)/gi;
  while ((match = rupiah.exec(text)) !== null) {
    const cents = toCents(match[1]);
    if (cents === null) continue;
    candidates.push({
      cents,
      currency: "IDR",
      index: match.index,
      raw: match[0],
      score: 0,
    });
  }

  const suffixed = /\b(\d[\d.,]*)\s?(USD|EUR|GBP|IDR|SGD|INR|PHP|AUD|CAD|MYR|THB|BRL|MXN)\b/gi;
  while ((match = suffixed.exec(text)) !== null) {
    const cents = toCents(match[1]);
    if (cents === null) continue;
    candidates.push({
      cents,
      currency: match[2].toUpperCase() as CurrencyCode,
      index: match.index,
      raw: match[0],
      score: 0,
    });
  }

  for (const candidate of candidates) {
    const before = text.slice(Math.max(0, candidate.index - 48), candidate.index);
    if (DUE_KEYWORDS.test(before)) candidate.score += 3;
    if (/\b(amount due|total due|balance due|payment due|next charge)\b/i.test(before)) {
      candidate.score += 2;
    }
    if (/\b(off|save|discount|credit|cashback|refund)\b/i.test(before)) candidate.score -= 4;
    if (/%/.test(before)) candidate.score -= 2;
    if (/\.\d{2}\b/.test(candidate.raw)) candidate.score += 1;
    candidate.score += Math.min(2, Math.log10(candidate.cents / 100 + 1));
  }

  return candidates;
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function buildDate(year: number, month: number, day: number): string | null {
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return `${year}-${`${month + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
}

function normalizeYear(year: number | undefined, month: number, day: number): string | null {
  const today = todayISO();
  const reference = new Date();
  const y = year ?? reference.getFullYear();
  let iso = buildDate(y, month, day);
  if (!iso) return null;
  if (!year && iso < addDaysISO(today, -90)) {
    iso = buildDate(y + 1, month, day);
  }
  if (!iso) return null;
  if (iso < addDaysISO(today, -90) || iso > addDaysISO(today, 400)) return null;
  return iso;
}

function findDueDate(text: string): string | null {
  const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    const iso = buildDate(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    if (iso && iso >= addDaysISO(todayISO(), -90) && iso <= addDaysISO(todayISO(), 400)) {
      return iso;
    }
  }

  const monthFirst = new RegExp(
    `\\b(${Object.keys(MONTHS).join("|")})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?\\b`,
    "i",
  );
  const monthFirstMatch = text.match(monthFirst);
  if (monthFirstMatch) {
    const month = MONTHS[monthFirstMatch[1].toLowerCase()];
    const iso = normalizeYear(
      monthFirstMatch[3] ? Number(monthFirstMatch[3]) : undefined,
      month,
      Number(monthFirstMatch[2]),
    );
    if (iso) return iso;
  }

  const dayFirst = new RegExp(
    `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${Object.keys(MONTHS).join("|")})\\.?(?:,?\\s*(\\d{4}))?\\b`,
    "i",
  );
  const dayFirstMatch = text.match(dayFirst);
  if (dayFirstMatch) {
    const month = MONTHS[dayFirstMatch[2].toLowerCase()];
    const iso = normalizeYear(
      dayFirstMatch[3] ? Number(dayFirstMatch[3]) : undefined,
      month,
      Number(dayFirstMatch[1]),
    );
    if (iso) return iso;
  }

  const numeric = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (numeric) {
    const yearRaw = Number(numeric[3]);
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    const iso = normalizeYear(year, Number(numeric[1]) - 1, Number(numeric[2]));
    if (iso) return iso;
  }

  const relative = text.match(/\bin\s+(\d{1,2})\s+days?\b/i);
  if (relative) {
    return addDaysISO(todayISO(), Number(relative[1]));
  }
  if (/\btomorrow\b/i.test(text)) return addDaysISO(todayISO(), 1);
  if (/\bdue today\b/i.test(text)) return todayISO();

  return null;
}

function detectCategory(text: string, knownCategory?: BillCategory): BillCategory {
  if (knownCategory) return knownCategory;
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.match.test(text)) return entry.category;
  }
  return "other";
}

function findInvoiceId(text: string): string | null {
  const match = text.match(
    /\b(?:invoice|account|statement|policy|reference)(?:\s*(?:#|no\.?|number|id))?\s*[:#]?\s*([A-Z0-9][A-Z0-9-]{3,18})\b/i,
  );
  if (!match) return null;
  const value = match[1].toUpperCase();
  if (/^\d{4}$/.test(value)) return null;
  return value;
}

export function heuristicExtract(email: RawEmail): HeuristicResult {
  const text = sanitizeEmailText(`${email.subject}\n${email.text}`, 6000);
  const lower = text.toLowerCase();
  const signals: string[] = [];

  const amountCandidates = findAmountCandidates(text).sort((a, b) => b.score - a.score);
  const best = amountCandidates[0] ?? null;

  const dueDate = findDueDate(text);
  const merchant = detectMerchant(email, text);
  const category = detectCategory(text, knownMerchantCategory(email));

  const positiveCue = BILL_CUES.some((cue) => cue.test(text));
  const negativeCue = NEGATIVE_CUES.some((cue) => cue.test(text));

  if (best) signals.push(`amount:${best.raw}`);
  if (dueDate) signals.push(`due:${dueDate}`);
  if (positiveCue) signals.push("bill-cue");
  if (negativeCue) signals.push("non-bill-cue");
  if (merchant.known) signals.push("known-merchant");

  const subscriptionCandidate =
    /\b(subscription|renews?|monthly|per month|annual|plan|membership|recurring)\b/i.test(
      lower,
    );

  let confidence = 0.55;
  if (best && best.score >= 3) confidence += 0.14;
  if (dueDate) confidence += 0.14;
  if (positiveCue) confidence += 0.08;
  if (merchant.known) confidence += 0.04;
  if (merchant.name) confidence += 0.03;
  if (category !== "other") confidence += 0.02;
  if (negativeCue) confidence -= 0.35;
  if (!best) confidence -= 0.25;
  if (!dueDate) confidence -= 0.12;
  confidence = Math.max(0.05, Math.min(0.99, Number(confidence.toFixed(2))));

  const isBill =
    Boolean(best) && !negativeCue && (Boolean(dueDate) || positiveCue || subscriptionCandidate);

  return {
    merchant: merchant.name,
    amountCents: isBill ? (best?.cents ?? null) : null,
    currency: best?.currency ?? "USD",
    dueDate,
    invoiceId: findInvoiceId(text),
    category,
    isSubscriptionCandidate: subscriptionCandidate,
    isBillingUncertain: !isBill && (positiveCue || Boolean(best)),
    confidence,
    isBill,
    signals,
  };
}

function knownMerchantCategory(email: RawEmail): BillCategory | undefined {
  const fingerprint = `${email.from} ${email.subject} ${senderDomain(email.from)}`;
  return KNOWN_MERCHANTS.find((entry) => entry.match.test(fingerprint))?.category;
}
