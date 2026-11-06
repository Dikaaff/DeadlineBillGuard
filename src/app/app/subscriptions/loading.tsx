import { Skeleton } from "@/components/ui/skeleton";

export default function SubscriptionsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-5" aria-busy="true">
      <span className="sr-only">Loading subscriptions</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3.5 w-80 max-w-full" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-xl border border-border/70 p-5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border/70">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex flex-col divide-y divide-border/60">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="hidden h-5 w-20 rounded-full md:block" />
              <Skeleton className="hidden h-3.5 w-20 md:block" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-32 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
