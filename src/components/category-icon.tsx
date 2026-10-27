import {
  CreditCard,
  Dumbbell,
  Home,
  Landmark,
  Layers,
  Receipt,
  ShieldCheck,
  Smartphone,
  Tv,
  Wifi,
  Zap,
} from "lucide-react";
import { cn } from "cn";
import type { BillCategory } from "@/lib/types";

const ICONS: Record<BillCategory, React.ComponentType<{ className?: string }>> = {
  utilities: Zap,
  internet: Wifi,
  phone: Smartphone,
  streaming: Tv,
  saas: Layers,
  insurance: ShieldCheck,
  rent: Home,
  loan: Landmark,
  credit_card: CreditCard,
  gym: Dumbbell,
  other: Receipt,
};

export function CategoryIcon({
  category,
  className,
}: {
  category: BillCategory;
  className?: string;
}) {
  const Icon = ICONS[category] ?? Receipt;
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/60",
        className,
      )}
      aria-hidden="true"
    >
      <Icon className="size-4" />
    </span>
  );
}
