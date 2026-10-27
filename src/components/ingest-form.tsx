"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircleIcon, CheckCircle2Icon, InboxIcon } from "lucide-react";
import { ingestPasteAction, type IngestState } from "@/lib/actions/inbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

const EMPTY_INGEST_STATE: IngestState = { status: "idle", message: "" };

export function IngestForm() {
  const [state, formAction, pending] = useActionState<IngestState, FormData>(
    ingestPasteAction,
    EMPTY_INGEST_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.status === "success" ? (
        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>Bill created</AlertTitle>
          <AlertDescription>
            {state.message}{" "}
            {state.billId ? (
              <Link href={`/app/bills/${state.billId}`} className="font-medium underline underline-offset-2">
                Open bill
              </Link>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Nothing added yet</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup className="gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="from">From</FieldLabel>
            <Input id="from" name="from" placeholder="billing@comcast.com" autoComplete="off" />
          </Field>
          <Field>
            <FieldLabel htmlFor="subject">Subject</FieldLabel>
            <Input
              id="subject"
              name="subject"
              placeholder="Your bill is ready"
              autoComplete="off"
              required
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="text">Email body</FieldLabel>
          <Textarea
            id="text"
            name="text"
            rows={7}
            placeholder={"Paste the invoice email. Include the amount and due date if you can.\n\nAmount due: $89.99\nDue date: March 14, 2026"}
            required
          />
        </Field>
      </FieldGroup>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : <InboxIcon data-icon="inline-start" />}
          {pending ? "Parsing" : "Parse email"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Groq → Gemini → deterministic parser. Nothing leaves the demo without a key.
        </p>
      </div>
    </form>
  );
}
