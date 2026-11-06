import { AppHeader, type HeaderReminder } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/db/store";
import { dueLabel, formatDateTime, formatMoney, initials } from "@/lib/format";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const user = await requireUser();
  const connection = await store.ensureConnection(user.id, user.email);
  await store.markOverdueBills(user.id);

  const [bills, subscriptions, reminders] = await Promise.all([
    store.listBills(user.id, { sort: "due" }),
    store.listSubscriptions(user.id),
    store.listUpcomingReminders(user.id, 4),
  ]);

  const open = bills.filter((b) => b.status === "pending" || b.status === "overdue");
  const overdueCount = bills.filter((b) => b.status === "overdue").length;

  const headerReminders: HeaderReminder[] = [];
  for (const reminder of reminders) {
    const bill = bills.find((b) => b.id === reminder.billId);
    if (!bill) continue;
    headerReminders.push({
      id: reminder.id,
      billId: bill.id,
      merchant: bill.merchant,
      amount: formatMoney(bill.amountCents, bill.currency),
      when: formatDateTime(reminder.sendAt, user.timezone),
      due: dueLabel(bill.dueDate, bill.status),
    });
  }

  return (
    <SidebarProvider>
      <AppSidebar
        overdueCount={overdueCount}
        pendingCount={open.length}
        subscriptionCount={subscriptions.length}
        address={connection.address}
        mode="demo"
      />
      <SidebarInset>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <AppHeader
          user={{ name: user.name, email: user.email, initials: initials(user.name) }}
          reminders={headerReminders}
          remindersEnabled={user.remindersEnabled !== false}
          reminderHour={user.reminderHour ?? 9}
        />
        <main id="main" tabIndex={-1} className="flex-1 px-4 pb-10 pt-6 md:px-8 md:pt-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
