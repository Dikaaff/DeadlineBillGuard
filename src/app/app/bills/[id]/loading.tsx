import { Skeleton } from "@/components/ui/skeleton";

export default function BillDetailLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-5" aria-busy="true">
      <span className="sr-only">Loading bill</span>
      <div className="flex items-start gap-3">
        <Skeleton className="size-8 rounded-md" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-3.5 w-64" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border/70">
            <div className="flex items-end justify-between gap-6 border-b border-border/70 px-6 py-6">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-3.5 w-32" />
              </div>
              <Skeleton className="size-12 rounded-xl" />
            </div>
            <div className="flex flex-col gap-3 px-6 py-6">
              <Skeleton className="h-9 w-64 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>

        <div className="flex flex-col gap-5">
          <div className="rounded-xl border border-border/70 p-6">
            <Skeleton className="h-5 w-32" />
            <div className="mt-5 flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex gap-3">
                  <Skeleton className="mt-1 size-2.5 rounded-full" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="h-44 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
