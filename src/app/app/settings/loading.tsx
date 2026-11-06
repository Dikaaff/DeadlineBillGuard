import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5" aria-busy="true">
      <span className="sr-only">Loading settings</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-3.5 w-64" />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border/70 p-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-72 max-w-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border/70 p-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-56" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-px w-full" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border/70 p-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-72 max-w-full" />
        <Skeleton className="h-14 rounded-lg" />
        <div className="flex items-end justify-between gap-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border/70 p-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-48" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-32 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border/70 p-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-8 w-36" />
      </div>
    </div>
  );
}
