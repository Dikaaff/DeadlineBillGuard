import { Skeleton } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-5" aria-busy="true">
      <span className="sr-only">Loading inbox</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-3.5 w-96 max-w-full" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-4 rounded-xl border border-border/70 p-5">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-64 max-w-full" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-px w-full" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-28" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-border/70 p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-56 max-w-full" />
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-8 w-36 self-end" />
        </div>
      </div>

      <div className="rounded-xl border border-border/70">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
        <div className="flex flex-col divide-y divide-border/60">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 px-5 py-3.5">
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="hidden h-3 w-28 md:block" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="hidden h-3.5 w-12 md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
