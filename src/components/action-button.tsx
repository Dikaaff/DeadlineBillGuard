"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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
          } catch {
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
