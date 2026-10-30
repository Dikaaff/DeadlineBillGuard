import type { BillCategory, CurrencyCode } from "@/lib/types";

const currencyLocale: Record<CurrencyCode, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  IDR: "id-ID",
  SGD: "en-SG",
  INR: "en-IN",
  PHP: "en-PH",
  AUD: "en-AU",
  CAD: "en-CA",
  MYR: "ms-MY",
  THB: "th-TH",
  BRL: "pt-BR",
  MXN: "es-MX",
};

export function formatMoney(
  cents: number,
  currency: CurrencyCode = "USD",
  options: { compact?: boolean } = {},
): string {
  const locale = currencyLocale[currency] ?? "en-US";
  const fractionDigits = currency === "IDR" ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: options.compact ? 0 : fractionDigits,
    maximumFractionDigits: options.compact ? 0 : fractionDigits,
  }).format(cents / 100);
}

export function formatMoneyWhole(cents: number, currency: CurrencyCode = "USD"): string {
  return new Intl.NumberFormat(currencyLocale[currency] ?? "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function todayISO(): string {
  const d = new Date();
  return toISODate(d);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const ISO_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

/** Accepts both `YYYY-MM-DD` and full ISO timestamps (`YYYY-MM-DDTHH:mm:ss.sssZ`). */
export function parseISODate(value: string): Date {
  const match = ISO_DATE_PREFIX.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(NaN) : parsed;
}

export function addDaysISO(value: string, days: number): string {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = Date.UTC(...toUTCParts(fromISO));
  const b = Date.UTC(...toUTCParts(toISO));
  return Math.round((b - a) / 86_400_000);
}

function toUTCParts(value: string): [number, number, number] {
  const [y, m, d] = value.split("-").map(Number);
  return [y, (m ?? 1) - 1, d ?? 1];
}

export function dueLabel(dueDate: string, status?: string): string {
  if (status === "paid") return "Paid";
  const diff = daysBetween(todayISO(), dueDate);
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff > 1) return `Due in ${diff} days`;
  if (diff === -1) return "1 day overdue";
  return `${Math.abs(diff)} days overdue`;
}

const DATE_FORMATTERS = {
  short: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }),
  long: new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }),
} as const;

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(value: string, style: "short" | "long" = "short"): string {
  const date = parseISODate(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return DATE_FORMATTERS[style].format(date);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return DATE_TIME_FORMATTER.format(date);
}

export function formatMonth(date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

export function initials(merchant: string): string {
  const words = merchant
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export const CATEGORY_LABELS: Record<BillCategory, string> = {
  utilities: "Utilities",
  internet: "Internet",
  phone: "Phone",
  streaming: "Streaming",
  saas: "Software",
  insurance: "Insurance",
  rent: "Rent",
  loan: "Loan",
  credit_card: "Credit card",
  gym: "Gym",
  other: "Other",
};

export function categoryLabel(category: BillCategory): string {
  return CATEGORY_LABELS[category] ?? "Other";
}

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
