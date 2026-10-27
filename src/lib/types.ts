export type BillStatus = "pending" | "paid" | "overdue" | "cancelled";

export type BillCategory =
  | "utilities"
  | "internet"
  | "phone"
  | "streaming"
  | "saas"
  | "insurance"
  | "rent"
  | "loan"
  | "credit_card"
  | "gym"
  | "other";

export type UsageStatus = "used" | "unused" | "unknown";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "IDR" | "SGD" | "INR" | "PHP" | "AUD" | "CAD" | "MYR" | "THB" | "BRL" | "MXN";

export interface User {
  id: string;
  email: string;
  name: string;
  currency: CurrencyCode;
  timezone: string;
  createdAt: string;
}

export interface EmailConnection {
  id: string;
  userId: string;
  provider: "forward" | "gmail";
  address: string;
  status: "active" | "paused" | "error";
  lastSyncAt: string | null;
  createdAt: string;
}

export interface Bill {
  id: string;
  userId: string;
  merchant: string;
  category: BillCategory;
  amountCents: number;
  currency: CurrencyCode;
  dueDate: string;
  invoiceId: string | null;
  sourceMessageId: string | null;
  rawSnippet: string | null;
  extractionConfidence: number;
  status: BillStatus;
  isSubscription: boolean;
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  billId: string;
  userId: string;
  sendAt: string;
  offsetDays: 7 | 3 | 1 | 0;
  channel: "email" | "push";
  sentAt: string | null;
}

export interface Subscription {
  id: string;
  userId: string;
  merchant: string;
  category: BillCategory;
  avgAmountCents: number;
  currency: CurrencyCode;
  cycleDays: number;
  nextDueDate: string;
  usageStatus: UsageStatus;
  lastBillId: string | null;
  createdCount: number;
  createdAt: string;
}

export interface PaypalEvent {
  id: string;
  billId: string | null;
  eventType: string;
  eventId: string;
  payload: Record<string, unknown>;
  receivedAt: string;
}

export interface IngestLog {
  id: string;
  userId: string;
  messageId: string | null;
  from: string;
  subject: string;
  result: "bill" | "ignored" | "uncertain" | "duplicate";
  confidence: number;
  billId: string | null;
  payload: Record<string, unknown> | null;
  receivedAt: string;
}

export interface Database {
  users: User[];
  bills: Bill[];
  reminders: Reminder[];
  subscriptions: Subscription[];
  connections: EmailConnection[];
  paypalEvents: PaypalEvent[];
  ingests: IngestLog[];
}

export interface PaymentEventInput {
  eventId: string;
  eventType: string;
  billId: string | null;
  payload: Record<string, unknown>;
}

export interface BillFilters {
  status?: BillStatus | "all";
  category?: BillCategory | "all";
  query?: string;
  sort?: "due" | "amount" | "recent";
}

export interface NewBill {
  merchant: string;
  category: BillCategory;
  amountCents: number;
  currency: CurrencyCode;
  dueDate: string;
  invoiceId?: string | null;
  sourceMessageId?: string | null;
  rawSnippet?: string | null;
  extractionConfidence: number;
  isSubscription?: boolean;
  status?: BillStatus;
}
