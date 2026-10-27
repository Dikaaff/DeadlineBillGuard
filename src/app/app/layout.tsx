import { AppHeader, type HeaderReminder } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/db/store";
import { dueLabel, formatMoney, initials } from "@/lib/format";

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
      when: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
      }).format(new Date(reminder.sendAt)),
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
        <AppHeader
          user={{ name: user.name, email: user.email, initials: initials(user.name) }}
          reminders={headerReminders}
        />
        <div className="flex-1 px-4 pb-10 pt-6 md:px-8 md:pt-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
