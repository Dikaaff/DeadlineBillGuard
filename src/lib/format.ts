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

export interface MoneyTotal {
  currency: CurrencyCode;
  cents: number;
}

/**
 * Groups amounts by currency. There is no FX conversion anywhere in the app, so totals stay
 * separate instead of silently adding e.g. rupiah to dollars.
 */
export function sumByCurrency(
  items: ReadonlyArray<{ amountCents: number; currency: CurrencyCode }>,
): MoneyTotal[] {
  const totals = new Map<CurrencyCode, number>();
  for (const item of items) {
    totals.set(item.currency, (totals.get(item.currency) ?? 0) + item.amountCents);
  }
  return [...totals.entries()]
    .map(([currency, cents]) => ({ currency, cents }))
    .sort((a, b) => b.cents - a.cents);
}

/** The currency most bills are denominated in, used for single-currency charts. */
export function dominantCurrency(
  items: ReadonlyArray<{ currency: CurrencyCode }>,
  fallback: CurrencyCode = "USD",
): CurrencyCode {
  const counts = new Map<CurrencyCode, number>();
  for (const item of items) counts.set(item.currency, (counts.get(item.currency) ?? 0) + 1);
  let best: CurrencyCode = fallback;
  let bestCount = 0;
  for (const [currency, count] of counts) {
    if (count > bestCount) {
      best = currency;
      bestCount = count;
    }
  }
  return best;
}

/** Formats a set of per-currency totals, e.g. "$120 + Rp1.500.000". */
export function formatMoneyTotals(
  totals: ReadonlyArray<MoneyTotal>,
  fallback: CurrencyCode = "USD",
): string {
  const nonZero = totals.filter((total) => total.cents !== 0);
  if (nonZero.length === 0) return formatMoneyWhole(0, fallback);
  return nonZero.map((total) => formatMoneyWhole(total.cents, total.currency)).join(" + ");
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

/** Offset of `timeZone` from UTC at `date`, in milliseconds (positive = east of UTC). */
function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const asUTC = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
  return asUTC - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Converts a calendar date plus a wall-clock hour in `timeZone` to a UTC ISO timestamp.
 * Without a timezone the server's local time is used.
 */
export function zonedHourISO(dateISO: string, hour: number, timeZone?: string): string {
  const [year, month, day] = toUTCParts(dateISO);
  const clamped = Math.min(Math.max(Math.trunc(hour), 0), 23);
  if (!timeZone) return new Date(year, month, day, clamped).toISOString();

  try {
    const wallClock = Date.UTC(year, month, day, clamped);
    let utc = wallClock - timeZoneOffsetMs(new Date(wallClock), timeZone);
    // Apply the offset a second time so DST transitions resolve to the offset in force.
    utc = wallClock - timeZoneOffsetMs(new Date(utc), timeZone);
    return new Date(utc).toISOString();
  } catch {
    return new Date(year, month, day, clamped).toISOString();
  }
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

type DateStyle = "short" | "long";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const DATE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  short: { month: "short", day: "numeric" },
  long: { month: "long", day: "numeric", year: "numeric" },
};

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

const TIME_OPTIONS: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(options: Intl.DateTimeFormatOptions, timeZone?: string): Intl.DateTimeFormat {
  const key = `${timeZone ?? ""}|${options.weekday ?? ""}|${options.month}|${options.day}|${options.year ?? ""}|${options.hour ?? ""}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;

  let created: Intl.DateTimeFormat;
  try {
    created = new Intl.DateTimeFormat("en-US", timeZone ? { ...options, timeZone } : options);
  } catch {
    // Unknown IANA zone: fall back to the server default instead of throwing during render.
    created = new Intl.DateTimeFormat("en-US", options);
  }
  formatterCache.set(key, created);
  return created;
}

/**
 * Formats a due date or timestamp. Date-only values (`YYYY-MM-DD`) are calendar dates and are
 * never shifted by a timezone; pass the user's zone for timestamps so days line up with them.
 */
export function formatDate(value: string, style: DateStyle = "short", timeZone?: string): string {
  const date = parseISODate(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return formatter(DATE_OPTIONS[style], DATE_ONLY.test(value) ? undefined : timeZone).format(date);
}

export function formatTime(value: string, timeZone?: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatter(TIME_OPTIONS, timeZone).format(date);
}

export function formatDateTime(value: string, timeZone?: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return formatter(DATE_TIME_OPTIONS, timeZone).format(date);
}

export function formatMonth(date = new Date(), timeZone?: string): string {
  return formatter({ month: "long", year: "numeric" }, timeZone).format(date);
}

/** Weekday + month + day for "today" in the user's timezone. */
export function formatWeekdayDate(date = new Date(), timeZone?: string): string {
  return formatter({ weekday: "long", month: "long", day: "numeric" }, timeZone).format(date);
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
