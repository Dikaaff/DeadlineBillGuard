import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  Bill,
  BillFilters,
  BillStatus,
  Database,
  EmailConnection,
  IngestLog,
  NewBill,
  PaymentEventInput,
  Reminder,
  Subscription,
  UsageStatus,
  User,
} from "@/lib/types";
import { createSeedDatabase, isoDate } from "./seed";

const DATA_DIR = process.env.DBG_DATA_DIR ?? path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

// Windows can briefly lock the target file (antivirus, indexer, another
// dev server), making rename fail with EPERM/EBUSY. Retry before giving up.
const RENAME_RETRY_CODES = new Set(["EPERM", "EBUSY", "EACCES", "EEXIST", "ENOENT"]);

async function renameWithRetry(from: string, to: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await fs.rename(from, to);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (!code || !RENAME_RETRY_CODES.has(code)) throw error;
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 40 * (attempt + 1)));
    }
  }
  // Last resort: overwrite in place so the write is not lost.
  try {
    await fs.copyFile(from, to);
    await fs.unlink(from);
  } catch {
    throw lastError;
  }
}

async function writeDatabase(db: Database): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await renameWithRetry(tmp, DATA_FILE);
}

async function readDatabase(): Promise<Database> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    if (!raw.trim()) throw new Error("empty store");
    return JSON.parse(raw) as Database;
  } catch {
    const seeded = createSeedDatabase();
    await writeDatabase(seeded);
    return seeded;
  }
}

async function mutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  return enqueue(async () => {
    const db = await readDatabase();
    const result = await fn(db);
    await writeDatabase(db);
    return result;
  });
}

function now(): string {
  return new Date().toISOString();
}

export const store = {
  async reset(): Promise<void> {
    return enqueue(async () => {
      await writeDatabase(createSeedDatabase());
    });
  },

  async getUserById(id: string): Promise<User | null> {
    const db = await readDatabase();
    return db.users.find((u) => u.id === id) ?? null;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const db = await readDatabase();
    const normalised = email.trim().toLowerCase();
    return db.users.find((u) => u.email.toLowerCase() === normalised) ?? null;
  },

  async createUser(email: string, name: string): Promise<User> {
    return mutate((db) => {
      const normalised = email.trim().toLowerCase();
      const existing = db.users.find((u) => u.email.toLowerCase() === normalised);
      if (existing) return existing;
      const user: User = {
        id: `usr_${randomUUID()}`,
        email: normalised,
        name: name.trim() || normalised.split("@")[0],
        currency: "USD",
        timezone: "America/Los_Angeles",
        createdAt: now(),
      };
      db.users.push(user);
      return user;
    });
  },

  async updateUser(
    id: string,
    patch: Partial<Pick<User, "name" | "currency" | "timezone">>,
  ): Promise<User | null> {
    return mutate((db) => {
      const user = db.users.find((u) => u.id === id);
      if (!user) return null;
      Object.assign(user, patch);
      return user;
    });
  },

  async listBills(userId: string, filters: BillFilters = {}): Promise<Bill[]> {
    const db = await readDatabase();
    const status = filters.status ?? "all";
    const category = filters.category ?? "all";
    const query = (filters.query ?? "").trim().toLowerCase();

    let rows = db.bills.filter((b) => b.userId === userId);
    if (status !== "all") rows = rows.filter((b) => b.status === status);
    if (category !== "all") rows = rows.filter((b) => b.category === category);
    if (query) {
      rows = rows.filter(
        (b) =>
          b.merchant.toLowerCase().includes(query) ||
          (b.invoiceId ?? "").toLowerCase().includes(query),
      );
    }

    const sort = filters.sort ?? "due";
    rows = [...rows].sort((a, b) => {
      if (sort === "amount") return b.amountCents - a.amountCents;
      if (sort === "recent") return b.createdAt.localeCompare(a.createdAt);
      return a.dueDate.localeCompare(b.dueDate);
    });

    return rows;
  },

  async getBill(userId: string, id: string): Promise<Bill | null> {
    const db = await readDatabase();
    return db.bills.find((b) => b.id === id && b.userId === userId) ?? null;
  },

  async findBillByMessageId(userId: string, messageId: string): Promise<Bill | null> {
    const db = await readDatabase();
    return (
      db.bills.find((b) => b.userId === userId && b.sourceMessageId === messageId) ??
      null
    );
  },

  async createBill(userId: string, input: NewBill): Promise<Bill> {
    return mutate((db) => {
      const bill: Bill = {
        id: `bill_${randomUUID()}`,
        userId,
        merchant: input.merchant,
        category: input.category,
        amountCents: input.amountCents,
        currency: input.currency,
        dueDate: input.dueDate,
        invoiceId: input.invoiceId ?? null,
        sourceMessageId: input.sourceMessageId ?? null,
        rawSnippet: input.rawSnippet?.slice(0, 500) ?? null,
        extractionConfidence: input.extractionConfidence,
        status: input.status ?? "pending",
        isSubscription: input.isSubscription ?? false,
        paypalOrderId: null,
        paypalCaptureId: null,
        paidAt: null,
        createdAt: now(),
        updatedAt: now(),
      };
      db.bills.push(bill);
      if (bill.isSubscription) {
        upsertSubscription(db, bill);
      }
      return bill;
    });
  },

  async findBillByPaypalOrderId(orderId: string): Promise<Bill | null> {
    const db = await readDatabase();
    return db.bills.find((b) => b.paypalOrderId === orderId) ?? null;
  },

  async setPaypalOrder(userId: string, id: string, orderId: string): Promise<void> {
    await mutate((db) => {
      const bill = db.bills.find((b) => b.id === id && b.userId === userId);
      if (bill) bill.paypalOrderId = orderId;
    });
  },

  async updateBill(
    userId: string,
    id: string,
    patch: Partial<Omit<Bill, "id" | "userId" | "createdAt">>,
  ): Promise<Bill | null> {
    return mutate((db) => {
      const bill = db.bills.find((b) => b.id === id && b.userId === userId);
      if (!bill) return null;
      Object.assign(bill, patch, { updatedAt: now() });
      return bill;
    });
  },

  async markBillPaid(
    userId: string,
    id: string,
    captureId: string | null,
    orderId: string | null,
  ): Promise<Bill | null> {
    return mutate((db) => {
      const bill = db.bills.find((b) => b.id === id && b.userId === userId);
      if (!bill) return null;
      bill.status = "paid";
      bill.paidAt = now();
      bill.paypalCaptureId = captureId ?? bill.paypalCaptureId;
      bill.paypalOrderId = orderId ?? bill.paypalOrderId;
      bill.updatedAt = now();
      db.reminders
        .filter((r) => r.billId === id && !r.sentAt)
        .forEach((r) => {
          r.sentAt = now();
        });
      return bill;
    });
  },

  async deleteBill(userId: string, id: string): Promise<boolean> {
    return mutate((db) => {
      const index = db.bills.findIndex((b) => b.id === id && b.userId === userId);
      if (index === -1) return false;
      db.bills.splice(index, 1);
      db.reminders = db.reminders.filter((r) => r.billId !== id);
      return true;
    });
  },

  async markOverdueBills(userId: string): Promise<number> {
    return mutate((db) => {
      const today = isoDate();
      let count = 0;
      for (const bill of db.bills) {
        if (
          bill.userId === userId &&
          bill.status === "pending" &&
          bill.dueDate < today
        ) {
          bill.status = "overdue";
          bill.updatedAt = now();
          count += 1;
        }
      }
      return count;
    });
  },

  async listRemindersForBill(userId: string, billId: string): Promise<Reminder[]> {
    const db = await readDatabase();
    return db.reminders
      .filter((r) => r.userId === userId && r.billId === billId)
      .sort((a, b) => a.sendAt.localeCompare(b.sendAt));
  },

  async listUpcomingReminders(userId: string, limit = 6): Promise<Reminder[]> {
    const db = await readDatabase();
    const nowIso = now();
    return db.reminders
      .filter((r) => r.userId === userId && !r.sentAt && r.sendAt >= nowIso)
      .sort((a, b) => a.sendAt.localeCompare(b.sendAt))
      .slice(0, limit);
  },

  async ensureRemindersForBill(
    userId: string,
    bill: Pick<Bill, "id" | "dueDate" | "status">,
  ): Promise<void> {
    if (bill.status !== "pending") return;
    await mutate((db) => {
      for (const offset of [7, 3, 1, 0] as const) {
        const exists = db.reminders.some(
          (r) => r.billId === bill.id && r.offsetDays === offset,
        );
        if (exists) continue;
        const due = new Date(`${bill.dueDate}T09:00:00`);
        due.setDate(due.getDate() - offset);
        db.reminders.push({
          id: `rem_${randomUUID()}`,
          billId: bill.id,
          userId,
          sendAt: due.toISOString(),
          offsetDays: offset,
          channel: "email",
          sentAt: null,
        });
      }
    });
  },

  async dueReminders(limit = 100): Promise<Reminder[]> {
    const db = await readDatabase();
    const nowIso = now();
    return db.reminders
      .filter((r) => !r.sentAt && r.sendAt <= nowIso)
      .sort((a, b) => a.sendAt.localeCompare(b.sendAt))
      .slice(0, limit);
  },

  async markReminderSent(id: string): Promise<void> {
    await mutate((db) => {
      const reminder = db.reminders.find((r) => r.id === id);
      if (reminder && !reminder.sentAt) reminder.sentAt = now();
    });
  },

  async listSubscriptions(userId: string): Promise<Subscription[]> {
    const db = await readDatabase();
    return db.subscriptions
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.avgAmountCents - a.avgAmountCents);
  },

  async updateSubscriptionUsage(
    userId: string,
    id: string,
    usage: UsageStatus,
  ): Promise<Subscription | null> {
    return mutate((db) => {
      const sub = db.subscriptions.find((s) => s.id === id && s.userId === userId);
      if (!sub) return null;
      sub.usageStatus = usage;
      return sub;
    });
  },

  async deleteSubscription(userId: string, id: string): Promise<boolean> {
    return mutate((db) => {
      const index = db.subscriptions.findIndex((s) => s.id === id && s.userId === userId);
      if (index === -1) return false;
      db.subscriptions.splice(index, 1);
      return true;
    });
  },

  async getConnection(userId: string): Promise<EmailConnection | null> {
    const db = await readDatabase();
    return db.connections.find((c) => c.userId === userId) ?? null;
  },

  async findUserByInboundAddress(address: string): Promise<User | null> {
    const db = await readDatabase();
    const normalised = address.trim().toLowerCase();
    const connection = db.connections.find(
      (c) => c.address.toLowerCase() === normalised && c.status === "active",
    );
    if (!connection) return null;
    return db.users.find((u) => u.id === connection.userId) ?? null;
  },

  async ensureConnection(userId: string, seedEmail: string): Promise<EmailConnection> {
    return mutate((db) => {
      const existing = db.connections.find((c) => c.userId === userId);
      if (existing) return existing;
      const slug = Buffer.from(userId).toString("base64url").slice(0, 6).toLowerCase();
      const connection: EmailConnection = {
        id: `conn_${randomUUID()}`,
        userId,
        provider: "forward",
        address: `${seedEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "")}.${slug}@inbox.billguard.app`,
        status: "active",
        lastSyncAt: null,
        createdAt: now(),
      };
      db.connections.push(connection);
      return connection;
    });
  },

  async logIngest(entry: Omit<IngestLog, "id" | "receivedAt">): Promise<IngestLog> {
    return mutate((db) => {
      const log: IngestLog = {
        ...entry,
        id: `ing_${randomUUID()}`,
        receivedAt: now(),
      };
      db.ingests.unshift(log);
      db.ingests = db.ingests.slice(0, 200);
      const connection = db.connections.find((c) => c.userId === entry.userId);
      if (connection) connection.lastSyncAt = log.receivedAt;
      return log;
    });
  },

  async listIngests(userId: string, limit = 20): Promise<IngestLog[]> {
    const db = await readDatabase();
    return db.ingests.filter((i) => i.userId === userId).slice(0, limit);
  },

  async getIngest(userId: string, id: string): Promise<IngestLog | null> {
    const db = await readDatabase();
    return db.ingests.find((i) => i.id === id && i.userId === userId) ?? null;
  },

  async updateIngest(
    userId: string,
    id: string,
    patch: Partial<Pick<IngestLog, "result" | "billId" | "confidence">>,
  ): Promise<IngestLog | null> {
    return mutate((db) => {
      const ingest = db.ingests.find((i) => i.id === id && i.userId === userId);
      if (!ingest) return null;
      Object.assign(ingest, patch);
      return ingest;
    });
  },

  async hasPaypalEvent(eventId: string): Promise<boolean> {
    const db = await readDatabase();
    return db.paypalEvents.some((e) => e.eventId === eventId);
  },

  async logPaypalEvent(input: PaymentEventInput): Promise<void> {
    await mutate((db) => {
      if (db.paypalEvents.some((e) => e.eventId === input.eventId)) return;
      db.paypalEvents.push({
        id: `evt_${randomUUID()}`,
        billId: input.billId,
        eventType: input.eventType,
        eventId: input.eventId,
        payload: input.payload,
        receivedAt: now(),
      });
    });
  },

  async listPaypalEvents(userId: string, limit = 10) {
    const db = await readDatabase();
    const billIds = new Set(
      db.bills.filter((b) => b.userId === userId).map((b) => b.id),
    );
    return db.paypalEvents
      .filter((e) => e.billId && billIds.has(e.billId))
      .slice(-limit)
      .reverse();
  },

  async exportAccount(userId: string) {
    const db = await readDatabase();
    const user = db.users.find((u) => u.id === userId) ?? null;
    return {
      exportedAt: now(),
      user,
      bills: db.bills.filter((b) => b.userId === userId),
      subscriptions: db.subscriptions.filter((s) => s.userId === userId),
      reminders: db.reminders.filter((r) => r.userId === userId),
      connections: db.connections.filter((c) => c.userId === userId),
      ingests: db.ingests.filter((i) => i.userId === userId),
    };
  },

  async deleteAccount(userId: string): Promise<void> {
    await mutate((db) => {
      db.users = db.users.filter((u) => u.id !== userId);
      db.bills = db.bills.filter((b) => b.userId !== userId);
      db.subscriptions = db.subscriptions.filter((s) => s.userId !== userId);
      db.reminders = db.reminders.filter((r) => r.userId !== userId);
      db.connections = db.connections.filter((c) => c.userId !== userId);
      db.ingests = db.ingests.filter((i) => i.userId !== userId);
      const billIds = new Set(db.bills.map((b) => b.id));
      db.paypalEvents = db.paypalEvents.filter(
        (e) => !e.billId || billIds.has(e.billId),
      );
    });
  },
};

function upsertSubscription(db: Database, bill: Bill): void {
  const existing = db.subscriptions.find(
    (s) => s.userId === bill.userId && s.merchant.toLowerCase() === bill.merchant.toLowerCase(),
  );
  if (existing) {
    existing.createdCount += 1;
    existing.avgAmountCents = Math.round(
      (existing.avgAmountCents * (existing.createdCount - 1) + bill.amountCents) /
        existing.createdCount,
    );
    existing.nextDueDate = bill.dueDate;
    existing.lastBillId = bill.id;
    return;
  }
  db.subscriptions.push({
    id: `sub_${randomUUID()}`,
    userId: bill.userId,
    merchant: bill.merchant,
    category: bill.category,
    avgAmountCents: bill.amountCents,
    currency: bill.currency,
    cycleDays: 30,
    nextDueDate: bill.dueDate,
    usageStatus: "unknown",
    lastBillId: bill.id,
    createdCount: 1,
    createdAt: now(),
  });
}

export function isOverdue(bill: Bill): boolean {
  return bill.status === "overdue";
}

export type { BillStatus };
