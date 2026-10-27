"use client";

import { useActionState } from "react";
import { AlertCircleIcon, ArrowRightIcon, SparklesIcon } from "lucide-react";
import { signInAction, type AuthState } from "@/lib/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signInAction, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup className="gap-3">
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" name="name" placeholder="Raka" autoComplete="name" />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <FieldDescription>
            New emails get a fresh, empty workspace with a forwarding address.
          </FieldDescription>
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Spinner data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
        Continue
        {!pending ? <ArrowRightIcon data-icon="inline-end" /> : null}
      </Button>
    </form>
  );
}
