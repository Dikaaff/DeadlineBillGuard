import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { RunwayDay } from "@/lib/domain";
import { formatDate, formatMoneyWhole } from "@/lib/format";
import { cn } from "cn";

export function Runway({
  days,
  currency = "USD",
}: {
  days: RunwayDay[];
  currency?: "USD" | "EUR" | "GBP" | "IDR" | "SGD" | "INR" | "PHP" | "AUD" | "CAD" | "MYR" | "THB" | "BRL" | "MXN";
}) {
  const peak = Math.max(...days.map((day) => day.totalCents), 1);
  const total = days.reduce((sum, day) => sum + day.totalCents, 0);
  const activeDays = days.filter((day) => day.totalCents > 0).length;

  return (
    <Card className="gap-0 overflow-visible">
      <CardHeader className="flex flex-row items-end justify-between gap-4 pb-4">
        <div className="flex flex-col gap-1">
          <CardTitle>Next 30 days</CardTitle>
          <p className="text-xs text-muted-foreground">
            {activeDays} payment{activeDays === 1 ? "" : "s"} scheduled · {formatMoneyWhole(total, currency)} total
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-[2px] bg-status-due" /> Due
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-[2px] bg-primary" /> Today
          </span>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-5">
        <div className="flex h-32 items-end gap-1 sm:gap-1.5">
          {days.map((day, index) => {
            const height = day.totalCents === 0 ? 3 : Math.max(8, Math.round((day.totalCents / peak) * 100));
            return (
              <div
                key={day.date}
                className="group/day flex h-full flex-1 flex-col justify-end"
                title={`${formatDate(day.date, "long")} · ${day.count} bill${day.count === 1 ? "" : "s"} · ${formatMoneyWhole(day.totalCents, currency)}`}
              >
                <div
                  className={cn(
                    "w-full rounded-[3px] transition-colors",
                    day.totalCents === 0
                      ? "bg-border"
                      : day.isToday
                        ? "bg-primary"
                        : index < 7
                          ? "bg-status-due"
                          : "bg-status-due/45 group-hover/day:bg-status-due/70",
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{formatDate(days[0]?.date ?? "", "short")}</span>
          <span className="hidden sm:block">{formatDate(days[9]?.date ?? "", "short")}</span>
          <span className="hidden sm:block">{formatDate(days[19]?.date ?? "", "short")}</span>
          <span>{formatDate(days[days.length - 1]?.date ?? "", "short")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
