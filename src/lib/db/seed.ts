import type {
  Bill,
  BillCategory,
  Database,
  Reminder,
  Subscription,
  User,
} from "@/lib/types";

export function isoDate(offsetDays = 0, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const NOW = new Date().toISOString();

export const DEMO_USER_ID = "usr_demo_0001";

function bill(
  id: string,
  merchant: string,
  category: BillCategory,
  amountCents: number,
  dueOffset: number,
  status: Bill["status"],
  extra: Partial<Bill> = {},
): Bill {
  return {
    id,
    userId: DEMO_USER_ID,
    merchant,
    category,
    amountCents,
    currency: "USD",
    dueDate: isoDate(dueOffset),
    invoiceId: null,
    sourceMessageId: `msg_${id}`,
    rawSnippet: null,
    extractionConfidence: 0.94,
    status,
    isSubscription: false,
    paypalOrderId: null,
    paypalCaptureId: null,
    paidAt: status === "paid" ? isoDate(dueOffset) : null,
    createdAt: NOW,
    updatedAt: NOW,
    ...extra,
  };
}

const bills: Bill[] = [
  bill("bill_pge_oct", "Pacific Gas & Electric", "utilities", 12844, 2, "pending", {
    invoiceId: "PGE-8841-2290",
    extractionConfidence: 0.97,
    rawSnippet:
      "Your PG&E statement is ready. Amount due: $128.44. Payment due date: Oct 26, 2026. Account ending 4412.",
  }),
  bill("bill_verizon_oct", "Verizon Wireless", "phone", 7550, -1, "overdue", {
    invoiceId: "VZ-99213",
    extractionConfidence: 0.93,
    rawSnippet:
      "Verizon bill for the period ending Oct 12. Total balance due $75.50. A late fee of $5 applies after Oct 23, 2026.",
  }),
  bill("bill_comcast_oct", "Comcast Xfinity", "internet", 8999, 5, "pending", {
    invoiceId: "CM-55120",
    extractionConfidence: 0.95,
    rawSnippet:
      "Your Xfinity Internet statement: Amount due $89.99. Due by Oct 29, 2026. Autopay is not enabled on this account.",
  }),
  bill("bill_netflix_nov", "Netflix", "streaming", 2299, 8, "pending", {
    isSubscription: true,
    invoiceId: "NF-2299",
    extractionConfidence: 0.98,
    rawSnippet:
      "Your Netflix subscription renews on Nov 1, 2026. You will be charged $22.99 for the Standard plan.",
  }),
  bill("bill_planet_oct", "Planet Fitness", "gym", 2499, 9, "pending", {
    isSubscription: true,
    extractionConfidence: 0.99,
    rawSnippet:
      "Planet Fitness membership: $24.99 due Nov 2, 2026. Your last club visit was 41 days ago.",
  }),
  bill("bill_adobe_oct", "Adobe Creative Cloud", "saas", 5999, 12, "pending", {
    isSubscription: true,
    extractionConfidence: 0.96,
    rawSnippet:
      "Adobe receipt for Creative Cloud All Apps. Next charge: $59.99 on Nov 5, 2026.",
  }),
  bill("bill_statefarm_oct", "State Farm", "insurance", 14200, -3, "overdue", {
    invoiceId: "SF-77120",
    extractionConfidence: 0.91,
    rawSnippet:
      "State Farm auto policy premium of $142.00 was due Oct 21, 2026. Your policy may lapse if unpaid.",
  }),
  bill("bill_chase_oct", "Chase Sapphire", "credit_card", 64000, 17, "pending", {
    invoiceId: "CH-4401",
    extractionConfidence: 0.9,
    rawSnippet:
      "Payment due: $640.00. Due date: Nov 10, 2026. Minimum payment due: $35.00. Statement balance: $2,140.22.",
  }),
  bill("bill_spotify_oct", "Spotify Premium", "streaming", 1199, 21, "pending", {
    isSubscription: true,
    extractionConfidence: 0.98,
    rawSnippet:
      "Spotify Premium Individual renews Nov 14, 2026 for $11.99/month. You have not streamed in 63 days.",
  }),
  bill("bill_water_sep", "City Water District", "utilities", 4620, -6, "paid", {
    paypalCaptureId: "CAP-SIM-88421",
    extractionConfidence: 0.94,
    rawSnippet:
      "Water and sewer statement: $46.20 due Oct 18, 2026. Paid online. Thank you.",
  }),
  bill("bill_notion_oct", "Notion Plus", "saas", 1000, 25, "pending", {
    isSubscription: true,
    extractionConfidence: 0.88,
    rawSnippet:
      "Your Notion Plus workspace renews on Nov 18, 2026. Total: $10.00 per member, per month.",
  }),
  bill("bill_rent_oct", "Keystone Property", "rent", 185000, -10, "paid", {
    paypalCaptureId: "CAP-SIM-77120",
    extractionConfidence: 0.99,
    rawSnippet:
      "October rent received: $1,850.00. Paid Oct 14, 2026. Next due Nov 1, 2026.",
  }),
];

const subscriptions: Subscription[] = [
  {
    id: "sub_netflix",
    userId: DEMO_USER_ID,
    merchant: "Netflix",
    category: "streaming",
    avgAmountCents: 2299,
    currency: "USD",
    cycleDays: 30,
    nextDueDate: isoDate(8),
    usageStatus: "used",
    lastBillId: "bill_netflix_nov",
    createdCount: 9,
    createdAt: NOW,
  },
  {
    id: "sub_spotify",
    userId: DEMO_USER_ID,
    merchant: "Spotify Premium",
    category: "streaming",
    avgAmountCents: 1199,
    currency: "USD",
    cycleDays: 30,
    nextDueDate: isoDate(21),
    usageStatus: "unused",
    lastBillId: "bill_spotify_oct",
    createdCount: 7,
    createdAt: NOW,
  },
  {
    id: "sub_adobe",
    userId: DEMO_USER_ID,
    merchant: "Adobe Creative Cloud",
    category: "saas",
    avgAmountCents: 5999,
    currency: "USD",
    cycleDays: 30,
    nextDueDate: isoDate(12),
    usageStatus: "used",
    lastBillId: "bill_adobe_oct",
    createdCount: 11,
    createdAt: NOW,
  },
  {
    id: "sub_planet",
    userId: DEMO_USER_ID,
    merchant: "Planet Fitness",
    category: "gym",
    avgAmountCents: 2499,
    currency: "USD",
    cycleDays: 30,
    nextDueDate: isoDate(9),
    usageStatus: "unused",
    lastBillId: "bill_planet_oct",
    createdCount: 6,
    createdAt: NOW,
  },
  {
    id: "sub_notion",
    userId: DEMO_USER_ID,
    merchant: "Notion Plus",
    category: "saas",
    avgAmountCents: 1000,
    currency: "USD",
    cycleDays: 30,
    nextDueDate: isoDate(25),
    usageStatus: "unknown",
    lastBillId: "bill_notion_oct",
    createdCount: 4,
    createdAt: NOW,
  },
];

function reminder(
  id: string,
  billId: string,
  offsetDays: 7 | 3 | 1 | 0,
  dueOffset: number,
  sent: boolean,
): Reminder {
  const sendAt = new Date(`${isoDate(dueOffset - offsetDays)}T09:00:00`);
  return {
    id,
    billId,
    userId: DEMO_USER_ID,
    sendAt: sendAt.toISOString(),
    offsetDays,
    channel: "email",
    sentAt: sent ? new Date().toISOString() : null,
  };
}

const reminders: Reminder[] = [
  reminder("rem_1", "bill_statefarm_oct", 1, -3, true),
  reminder("rem_2", "bill_statefarm_oct", 0, -3, true),
  reminder("rem_3", "bill_verizon_oct", 1, -1, true),
  reminder("rem_4", "bill_pge_oct", 3, 2, true),
  reminder("rem_5", "bill_pge_oct", 1, 2, false),
  reminder("rem_6", "bill_comcast_oct", 3, 5, false),
  reminder("rem_7", "bill_netflix_nov", 7, 8, false),
  reminder("rem_8", "bill_chase_oct", 7, 17, false),
];

const user: User = {
  id: DEMO_USER_ID,
  email: "you@billguard.app",
  name: "Raka",
  currency: "USD",
  timezone: "America/Los_Angeles",
  createdAt: NOW,
};

export function createSeedDatabase(): Database {
  return {
    users: [user],
    bills,
    reminders,
    subscriptions,
    connections: [
      {
        id: "conn_forward",
        userId: DEMO_USER_ID,
        provider: "forward",
        address: "raka.k7f2@inbox.billguard.app",
        status: "active",
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 34).toISOString(),
        createdAt: NOW,
      },
    ],
    paypalEvents: [
      {
        id: "evt_seed_water",
        billId: "bill_water_sep",
        eventType: "PAYMENT.CAPTURE.COMPLETED",
        eventId: "WH-SIM-88421",
        payload: { amount: "46.20", currency: "USD", mode: "sandbox" },
        receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
      },
    ],
    ingests: [
      {
        id: "ing_1",
        userId: DEMO_USER_ID,
        messageId: "msg_bill_pge_oct",
        from: "billing@pge.com",
        subject: "Your PG&E statement is ready",
        result: "bill",
        confidence: 0.97,
        payload: null,
        billId: "bill_pge_oct",
        receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      },
      {
        id: "ing_2",
        userId: DEMO_USER_ID,
        messageId: "msg_bill_netflix_nov",
        from: "info@netflix.com",
        subject: "Your Netflix subscription renews soon",
        result: "bill",
        confidence: 0.98,
        payload: null,
        billId: "bill_netflix_nov",
        receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      },
      {
        id: "ing_3",
        userId: DEMO_USER_ID,
        messageId: "msg_promo",
        from: "deals@shopmail.com",
        subject: "48 hours only: 30% off everything",
        result: "ignored",
        confidence: 0.12,
        payload: null,
        billId: null,
        receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      },
    ],
  };
}
