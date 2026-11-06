"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/** Submit button that disables itself and shows a spinner while its form action runs. */
export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" {...props} disabled={pending || props.disabled} aria-busy={pending || undefined}>
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
