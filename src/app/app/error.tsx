"use client";

import Link from "next/link";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4 py-10">
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertTitle>Something broke on this page</AlertTitle>
        <AlertDescription>
          The server hit an unexpected error. Your data is unchanged, so you can try again or go
          back to the overview.
          {error.digest ? (
            <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
              Reference: {error.digest}
            </span>
          ) : null}
        </AlertDescription>
      </Alert>
      <div className="flex flex-wrap gap-2">
        <Button onClick={reset}>
          <RefreshCwIcon data-icon="inline-start" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/app">Back to overview</Link>
        </Button>
      </div>
    </div>
  );
}
