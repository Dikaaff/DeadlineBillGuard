import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import { daysBetween, todayISO } from "@/lib/format";
import type { Bill } from "@/lib/types";

export function BillStatusBadge({
  bill,
  className,
}: {
  bill: Pick<Bill, "status" | "dueDate">;
  className?: string;
}) {
  const dueIn = daysBetween(todayISO(), bill.dueDate);
  const dueSoon = bill.status === "pending" && dueIn <= 3;

  const tone =
    bill.status === "overdue" || (bill.status === "pending" && dueIn < 0)
      ? "border-status-overdue/25 bg-status-overdue-surface text-status-overdue"
      : bill.status === "paid"
        ? "border-status-paid/25 bg-status-paid-surface text-status-paid"
        : dueSoon
          ? "border-status-due/25 bg-status-due-surface text-status-due"
          : "border-border bg-muted/60 text-muted-foreground";

  const label =
    bill.status === "paid"
      ? "Paid"
      : bill.status === "cancelled"
        ? "Cancelled"
        : bill.status === "overdue" || dueIn < 0
          ? "Overdue"
          : dueSoon
            ? "Due soon"
            : "Scheduled";

  return (
    <Badge variant="outline" className={cn(tone, "gap-1.5 font-medium", className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </Badge>
  );
}

export function StatusDot({ tone }: { tone: "due" | "overdue" | "paid" | "idle" }) {
  const map = {
    due: "bg-status-due",
    overdue: "bg-status-overdue",
    paid: "bg-status-paid",
    idle: "bg-status-idle",
  } as const;
  return <span className={cn("inline-block size-2 rounded-full", map[tone])} aria-hidden="true" />;
}
