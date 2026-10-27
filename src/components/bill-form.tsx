"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertCircleIcon, CalendarDaysIcon, SaveIcon } from "lucide-react";
import { saveBillAction, type BillFormState } from "@/lib/actions/bills";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { CATEGORY_LABELS, todayISO } from "@/lib/format";
import type { Bill, BillCategory, CurrencyCode } from "@/lib/types";

const CURRENCIES: CurrencyCode[] = [
  "USD", "EUR", "GBP", "IDR", "SGD", "INR", "PHP", "AUD", "CAD", "MYR", "THB", "BRL", "MXN",
];

const CATEGORIES: BillCategory[] = [
  "utilities", "internet", "phone", "streaming", "saas", "insurance",
  "rent", "loan", "credit_card", "gym", "other",
];

export function BillForm({ bill }: { bill?: Bill }) {
  const action = React.useMemo(
    () => saveBillAction.bind(null, bill?.id ?? null),
    [bill?.id],
  );
  const [state, formAction, pending] = useActionState<BillFormState, FormData>(action, {
    error: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
          <Field>
            <FieldLabel htmlFor="merchant">Merchant</FieldLabel>
            <Input
              id="merchant"
              name="merchant"
              defaultValue={bill?.merchant ?? ""}
              placeholder="Comcast Xfinity"
              autoComplete="off"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="invoiceId">Invoice or account number</FieldLabel>
            <Input
              id="invoiceId"
              name="invoiceId"
              defaultValue={bill?.invoiceId ?? ""}
              placeholder="Optional"
              autoComplete="off"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field className="sm:col-span-1">
            <FieldLabel htmlFor="amount">Amount</FieldLabel>
            <Input
              id="amount"
              name="amount"
              inputMode="decimal"
              defaultValue={bill ? (bill.amountCents / 100).toFixed(2) : ""}
              placeholder="89.99"
              required
            />
            <FieldDescription>The amount that is actually due.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="currency">Currency</FieldLabel>
            <Select name="currency" defaultValue={bill?.currency ?? "USD"}>
              <SelectTrigger id="currency" className="w-full">
                <SelectValue placeholder="USD" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="dueDate">Due date</FieldLabel>
            <div className="relative">
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={bill?.dueDate ?? todayISO()}
                required
                className="pr-8"
              />
              <CalendarDaysIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <Select name="category" defaultValue={bill?.category ?? "other"}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Other" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field orientation="horizontal" className="items-center rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5">
            <Checkbox
              id="isSubscription"
              name="isSubscription"
              defaultChecked={bill?.isSubscription ?? false}
            />
            <div className="flex flex-col gap-0.5">
              <FieldLabel htmlFor="isSubscription" className="font-normal">
                Recurring subscription
              </FieldLabel>
              <FieldDescription>
                Groups repeated charges so we can spot unused plans.
              </FieldDescription>
            </div>
          </Field>
        </div>
      </FieldGroup>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
          {bill ? "Save changes" : "Add bill"}
        </Button>
        <p className="text-xs text-muted-foreground">
          {bill ? "Reminders are recalculated from the new due date." : "We schedule H-7, H-3, H-1 and H-0 reminders."}
        </p>
      </div>
    </form>
  );
}
