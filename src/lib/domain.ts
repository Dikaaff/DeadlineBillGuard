import type { Bill, EmailConnection, IngestLog, Reminder, Subscription } from "@/lib/types";
import { store } from "@/lib/db/store";
import { addDaysISO, daysBetween, todayISO } from "@/lib/format";

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
    dueSoonCents: number;
    overdueCount: number;
    overdueCents: number;
    monthTotalCents: number;
    paidThisMonthCents: number;
    subscriptionMonthlyCents: number;
    savingsYearlyCents: number;
    pendingCount: number;
  };
  nextBill: Bill | null;
  runway: RunwayDay[];
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
  const dueSoon = open.filter((b) => daysBetween(today, b.dueDate) <= 7);
  const overdue = bills.filter((b) => b.status === "overdue");
  const monthBills = bills.filter(
    (b) => b.dueDate.startsWith(monthPrefix) && b.status !== "cancelled",
  );
  const paidThisMonth = bills.filter(
    (b) => b.status === "paid" && (b.paidAt ?? "").startsWith(monthPrefix),
  );

  const subscriptionMonthly = subscriptions
    .filter((s) => s.usageStatus !== "unused")
    .reduce((sum, s) => sum + s.avgAmountCents, 0);
  const savingsYearly = subscriptions
    .filter((s) => s.usageStatus === "unused")
    .reduce((sum, s) => sum + s.avgAmountCents * 12, 0);

  const runway: RunwayDay[] = Array.from({ length: 30 }, (_, index) => {
    const date = addDaysISO(today, index);
    const dayBills = bills.filter(
      (b) => b.dueDate === date && b.status !== "paid" && b.status !== "cancelled",
    );
    return {
      date,
      totalCents: dayBills.reduce((sum, b) => sum + b.amountCents, 0),
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
      dueSoonCents: dueSoon.reduce((sum, b) => sum + b.amountCents, 0),
      overdueCount: overdue.length,
      overdueCents: overdue.reduce((sum, b) => sum + b.amountCents, 0),
      monthTotalCents: monthBills.reduce((sum, b) => sum + b.amountCents, 0),
      paidThisMonthCents: paidThisMonth.reduce((sum, b) => sum + b.amountCents, 0),
      subscriptionMonthlyCents: subscriptionMonthly,
      savingsYearlyCents: savingsYearly,
      pendingCount: open.length,
    },
    nextBill: dueSoon[0] ?? open[0] ?? null,
    runway,
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
