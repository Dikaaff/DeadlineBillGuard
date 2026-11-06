import { Skeleton } from "@/components/ui/skeleton";

export default function BillsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5" aria-busy="true">
      <span className="sr-only">Loading bills</span>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3.5 w-52" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      <div className="rounded-xl border border-border/70 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-6 w-20 rounded-full" />
          ))}
          <Skeleton className="ml-auto h-8 w-52" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      <div className="rounded-xl border border-border/70">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex flex-col divide-y divide-border/60">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 px-5 py-3.5">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-44" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="hidden h-3.5 w-20 sm:block" />
              <Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
