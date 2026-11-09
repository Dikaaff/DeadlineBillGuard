"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

function isNavigationError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && /^NEXT_(REDIRECT|HTTP_ERROR_FALLBACK)/.test(digest);
}

type ActionButtonProps = React.ComponentProps<typeof Button> & {
  /** Server action to run, usually bound with its target id. */
  action: () => Promise<void>;
  confirm?: string;
  success?: string;
  pendingLabel?: string;
};

export function ActionButton({
  action,
  confirm,
  success,
  pendingLabel,
  children,
  disabled,
  onClick,
  type = "button",
  ...props
}: ActionButtonProps) {
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      {...props}
      type={type}
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        startTransition(async () => {
          try {
            await action();
            if (success) toast.success(success);
          } catch (error) {
            if (isNavigationError(error)) return;
            toast.error("That did not go through. Please try again.");
          }
        });
      }}
    >
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
