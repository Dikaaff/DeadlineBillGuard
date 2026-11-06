import { Skeleton } from "@/components/ui/skeleton";

export default function EditBillLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5" aria-busy="true">
      <span className="sr-only">Loading bill form</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3.5 w-72 max-w-full" />
      </div>

      <div className="rounded-xl border border-border/70">
        <div className="flex flex-col gap-2 border-b border-border/70 px-6 py-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="flex flex-col gap-4 px-6 py-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-4 w-24" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
