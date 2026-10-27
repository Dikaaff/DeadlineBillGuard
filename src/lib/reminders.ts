import { store } from "@/lib/db/store";
import { sendEmail, reminderEmailHtml } from "@/lib/email";
import { formatDate, formatMoney, dueLabel } from "@/lib/format";
import type { Bill } from "@/lib/types";

export interface ReminderRunSummary {
  sent: number;
  skipped: number;
  failed: number;
  transport: "resend" | "console";
  details: Array<{ billId: string; merchant: string; offsetDays: number; result: string }>;
}

export async function ensureReminders(userId: string): Promise<number> {
  const bills = await store.listBills(userId, { status: "pending" });
  let created = 0;
  for (const bill of bills) {
    await store.ensureRemindersForBill(userId, bill);
    created += 1;
  }
  return created;
}

export async function runReminderJob(appUrl: string): Promise<ReminderRunSummary> {
  const reminders = await store.dueReminders(100);
  const summary: ReminderRunSummary = {
    sent: 0,
    skipped: 0,
    failed: 0,
    transport: process.env.RESEND_API_KEY ? "resend" : "console",
    details: [],
  };

  for (const reminder of reminders) {
    const bill = await store.getBill(reminder.userId, reminder.billId);
    if (!bill || bill.status === "paid" || bill.status === "cancelled") {
      await store.markReminderSent(reminder.id);
      summary.skipped += 1;
      continue;
    }

    const user = await store.getUserById(reminder.userId);
    if (!user) {
      await store.markReminderSent(reminder.id);
      summary.skipped += 1;
      continue;
    }

    const deliverable =
      Boolean(process.env.RESEND_API_KEY) && !user.email.endsWith("@billguard.app");

    if (deliverable) {
      const result = await sendEmail({
        to: user.email,
        subject: `${bill.merchant}: ${formatMoney(bill.amountCents, bill.currency)} ${dueLabel(bill.dueDate, bill.status).toLowerCase()}`,
        html: reminderEmailHtml({
          name: user.name,
          merchant: bill.merchant,
          amount: formatMoney(bill.amountCents, bill.currency),
          dueLabel: formatDate(bill.dueDate, "long"),
          appUrl,
          billId: bill.id,
          offsetDays: reminder.offsetDays,
        }),
      });
      if (!result.sent) {
        summary.failed += 1;
        summary.details.push({
          billId: bill.id,
          merchant: bill.merchant,
          offsetDays: reminder.offsetDays,
          result: result.error ?? "not sent",
        });
        continue;
      }
    }

    await store.markReminderSent(reminder.id);
    summary.sent += 1;
    summary.details.push({
      billId: bill.id,
      merchant: bill.merchant,
      offsetDays: reminder.offsetDays,
      result: deliverable ? "sent" : "logged",
    });
  }

  return summary;
}

export function buildReminderSchedule(bill: Bill): Array<{ offsetDays: number; date: string }> {
  return [7, 3, 1, 0].map((offsetDays) => {
    const date = new Date(`${bill.dueDate}T09:00:00`);
    date.setDate(date.getDate() - offsetDays);
    return { offsetDays, date: date.toISOString() };
  });
}
