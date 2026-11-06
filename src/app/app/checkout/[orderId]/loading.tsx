import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4 py-2" aria-busy="true">
      <span className="sr-only">Loading checkout</span>
      <Skeleton className="h-7 w-28" />
      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="flex items-center justify-between bg-[#003087]/90 px-6 py-4">
          <Skeleton className="h-5 w-20 bg-white/25" />
          <Skeleton className="h-3 w-24 bg-white/25" />
        </div>
        <div className="flex flex-col gap-5 px-6 py-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-52" />
          </div>
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-3 w-3/4 self-center" />
        </div>
      </div>
    </div>
  );
}
