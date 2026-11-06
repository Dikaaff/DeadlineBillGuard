import type { Bill, CurrencyCode, EmailConnection, IngestLog, Reminder, Subscription } from "@/lib/types";
import { store } from "@/lib/db/store";
import {
  addDaysISO,
  daysBetween,
  dominantCurrency,
  sumByCurrency,
  todayISO,
  type MoneyTotal,
} from "@/lib/format";

export interface RunwayDay {
  date: string;
  totalCents: number;
  count: number;
  isToday: boolean;
}

export interface SavingsInsight {
  subscription: Subscription;
  yearlyCents: number;
  monthlyCents: number;
  reason: string;
  confidence: "high" | "medium" | "low";
}

export interface DashboardData {
  bills: Bill[];
  subscriptions: Subscription[];
  connection: EmailConnection | null;
  ingests: IngestLog[];
  reminders: Reminder[];
  stats: {
    dueSoonCount: number;
    dueSoonTotals: MoneyTotal[];
    overdueCount: number;
    overdueTotals: MoneyTotal[];
    monthTotalTotals: MoneyTotal[];
    paidThisMonthTotals: MoneyTotal[];
    subscriptionMonthlyTotals: MoneyTotal[];
    savingsYearlyTotals: MoneyTotal[];
    pendingCount: number;
  };
  nextBill: Bill | null;
  runway: RunwayDay[];
  /** Single currency the runway chart is denominated in. */
  runwayCurrency: CurrencyCode;
  insights: SavingsInsight[];
}

export async function getDashboard(userId: string): Promise<DashboardData> {
  await store.markOverdueBills(userId);

  const [bills, subscriptions, connection, ingests, reminders] = await Promise.all([
    store.listBills(userId, { sort: "due" }),
    store.listSubscriptions(userId),
    store.getConnection(userId),
    store.listIngests(userId, 6),
    store.listUpcomingReminders(userId, 5),
  ]);

  const today = todayISO();
  const monthPrefix = today.slice(0, 7);

  const open = bills.filter((b) => b.status === "pending" || b.status === "overdue");
  const dueSoon = open.filter((b) => {
    const days = daysBetween(today, b.dueDate);
    // Overdue bills are already their own stat; "next 7 days" means today through +7.
    return days >= 0 && days <= 7;
  });
  const overdue = bills.filter((b) => b.status === "overdue");
  const monthBills = bills.filter(
    (b) => b.dueDate.startsWith(monthPrefix) && b.status !== "cancelled",
  );
  const paidThisMonth = bills.filter(
    (b) => b.status === "paid" && (b.paidAt ?? "").startsWith(monthPrefix),
  );

  const subscriptionMonthly = sumByCurrency(
    subscriptions
      .filter((s) => s.usageStatus !== "unused")
      .map((s) => ({ amountCents: s.avgAmountCents, currency: s.currency })),
  );
  const savingsYearly = sumByCurrency(
    subscriptions
      .filter((s) => s.usageStatus === "unused")
      .map((s) => ({ amountCents: s.avgAmountCents * 12, currency: s.currency })),
  );

  const runwayBills = bills.filter((b) => b.status !== "paid" && b.status !== "cancelled");
  const runwayCurrency = dominantCurrency(runwayBills);

  const runway: RunwayDay[] = Array.from({ length: 30 }, (_, index) => {
    const date = addDaysISO(today, index);
    const dayBills = runwayBills.filter((b) => b.dueDate === date);
    return {
      date,
      totalCents: dayBills
        .filter((b) => b.currency === runwayCurrency)
        .reduce((sum, b) => sum + b.amountCents, 0),
      count: dayBills.length,
      isToday: date === today,
    };
  });

  const insights: SavingsInsight[] = subscriptions
    .filter((s) => s.usageStatus === "unused")
    .map((subscription) => ({
      subscription,
      yearlyCents: subscription.avgAmountCents * 12,
      monthlyCents: subscription.avgAmountCents,
      reason:
        subscription.createdCount >= 4
          ? `Charged ${subscription.createdCount} times, but you flagged it as not in use.`
          : "You flagged this as not in use.",
      confidence: (subscription.createdCount >= 4 ? "high" : "medium") as SavingsInsight["confidence"],
    }))
    .sort((a, b) => b.yearlyCents - a.yearlyCents);

  return {
    bills,
    subscriptions,
    connection,
    ingests,
    reminders,
    stats: {
      dueSoonCount: dueSoon.length,
      dueSoonTotals: sumByCurrency(dueSoon),
      overdueCount: overdue.length,
      overdueTotals: sumByCurrency(overdue),
      monthTotalTotals: sumByCurrency(monthBills),
      paidThisMonthTotals: sumByCurrency(paidThisMonth),
      subscriptionMonthlyTotals: subscriptionMonthly,
      savingsYearlyTotals: savingsYearly,
      pendingCount: open.length,
    },
    nextBill: dueSoon[0] ?? open[0] ?? null,
    runway,
    runwayCurrency,
    insights,
  };
}

export async function getBillContext(userId: string, billId: string) {
  const [bill, reminders, subscriptions] = await Promise.all([
    store.getBill(userId, billId),
    store.listRemindersForBill(userId, billId),
    store.listSubscriptions(userId),
  ]);
  if (!bill) return null;
  const subscription =
    subscriptions.find(
      (s) => s.merchant.toLowerCase() === bill.merchant.toLowerCase(),
    ) ?? null;
  return { bill, reminders, subscription };
}

export function monthlyEquivalent(subscription: Subscription): number {
  return Math.round((subscription.avgAmountCents * 30) / subscription.cycleDays);
}

export function yearlyEquivalent(subscription: Subscription): number {
  return Math.round((subscription.avgAmountCents * 365) / subscription.cycleDays);
}
