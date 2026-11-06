import Link from "next/link";
import { FileQuestionIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileQuestionIcon className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page or bill you were looking for is gone, or never existed.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/app">Go to overview</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/app/bills">See all bills</Link>
        </Button>
      </div>
    </main>
  );
}
