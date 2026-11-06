import Link from "next/link";
import {
  BellRingIcon,
  DownloadIcon,
  KeyRoundIcon,
  RefreshCcwIcon,
  ShieldAlertIcon,
  UserRoundIcon,
} from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { CopyButton } from "@/components/copy-button";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { FlashAlert } from "@/components/flash-alert";
import { ReminderSettingsForm } from "@/components/reminder-settings-form";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { resetDemoDataAction, updateProfileAction } from "@/lib/actions/settings";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/db/store";
import type { CurrencyCode } from "@/lib/types";

export const metadata = { title: "Settings" };

const CURRENCIES: CurrencyCode[] = [
  "USD", "EUR", "GBP", "IDR", "SGD", "INR", "PHP", "AUD", "CAD", "MYR", "THB", "BRL", "MXN",
];

const TIMEZONES = [
  "UTC",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "America/Anchorage",
  "America/Argentina/Buenos_Aires",
  "America/Bogota",
  "America/Chicago",
  "America/Denver",
  "America/Halifax",
  "America/Lima",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Phoenix",
  "America/Santiago",
  "America/Sao_Paulo",
  "America/Toronto",
  "America/Vancouver",
  "Asia/Bangkok",
  "Asia/Dhaka",
  "Asia/Dubai",
  "Asia/Ho_Chi_Minh",
  "Asia/Hong_Kong",
  "Asia/Jakarta",
  "Asia/Karachi",
  "Asia/Kathmandu",
  "Asia/Kolkata",
  "Asia/Kuala_Lumpur",
  "Asia/Manila",
  "Asia/Riyadh",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Taipei",
  "Asia/Tokyo",
  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/Istanbul",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Paris",
  "Europe/Rome",
  "Europe/Warsaw",
  "Europe/Zurich",
  "Pacific/Auckland",
  "Pacific/Honolulu",
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const connection = await store.getConnection(user.id);
  const aiProvider = process.env.GROQ_API_KEY
    ? "Groq · llama-3.3-70b"
    : process.env.GEMINI_API_KEY
      ? "Gemini · 2.0 Flash"
      : "Heuristic (no key)";
  const paypalMode =
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET ? "Live sandbox" : "Simulated";

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Profile, integrations and the scary buttons.
        </p>
      </div>

      {params.saved ? (
        <FlashAlert>
          <Alert>
            <UserRoundIcon />
            <AlertTitle>Profile updated</AlertTitle>
            <AlertDescription>
              Your changes are live. Reminders created from now on use the new settings.
            </AlertDescription>
          </Alert>
        </FlashAlert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRoundIcon className="size-4 text-muted-foreground" />
            Profile
          </CardTitle>
          <CardDescription>How reminders address you and which currency to show.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfileAction} className="flex flex-col gap-4">
            <FieldGroup className="gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input id="name" name="name" defaultValue={user.name} required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" value={user.email} disabled readOnly />
                  <FieldDescription>Used for sign-in and reminders.</FieldDescription>
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="currency">Display currency</FieldLabel>
                  <Select name="currency" defaultValue={user.currency}>
                    <SelectTrigger id="currency" className="w-full">
                      <SelectValue />
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
                  <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                  <Select name="timezone" defaultValue={user.timezone}>
                    <SelectTrigger id="timezone" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {TIMEZONES.map((zone) => (
                          <SelectItem key={zone} value={zone}>
                            {zone}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </FieldGroup>
            <div>
              <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integrations</CardTitle>
          <CardDescription>Everything runs on free tiers by default.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">Inbound forwarding</p>
              <p className="font-mono text-xs text-muted-foreground">
                {connection?.address ?? "unconfigured"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-normal capitalize">
                {connection?.status ?? "n/a"}
              </Badge>
              <CopyButton value={connection?.address ?? ""} label="Copy" />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">Extraction model</p>
              <p className="text-xs text-muted-foreground">
                Falls back deterministically when no key is present.
              </p>
            </div>
            <Badge variant="outline" className="font-normal">
              {aiProvider}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">PayPal</p>
              <p className="text-xs text-muted-foreground">
                {paypalMode === "Simulated"
                  ? "Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET for real sandbox orders."
                  : "Orders v2 with webhook signature verification."}
              </p>
            </div>
            <Badge variant={paypalMode === "Simulated" ? "secondary" : "outline"} className="font-normal">
              {paypalMode}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRingIcon className="size-4 text-muted-foreground" />
            Reminders
          </CardTitle>
          <CardDescription>
            When we email you before a due date, and whether we email at all.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReminderSettingsForm
            enabled={user.remindersEnabled !== false}
            hour={user.reminderHour ?? 9}
            timezone={user.timezone}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reminder cadence</CardTitle>
          <CardDescription>Four touches before every due date.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {[
            { label: "H-7", copy: "One week before" },
            { label: "H-3", copy: "Three days before" },
            { label: "H-1", copy: "Day before" },
            { label: "H-0", copy: "On the due date" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
              <p className="font-mono text-xs font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.copy}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRoundIcon className="size-4 text-muted-foreground" />
            Your data
          </CardTitle>
          <CardDescription>Export it, reset the demo, or walk away clean.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Export everything</p>
              <p className="text-xs text-muted-foreground">Bills, reminders and subscriptions as CSV.</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href="/api/bills/export" download>
                <DownloadIcon data-icon="inline-start" />
                Download CSV
              </a>
            </Button>
          </div>
          <Separator />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Reset demo data</p>
              <p className="text-xs text-muted-foreground">
                Restores the seeded bills and subscriptions. Your session stays valid.
              </p>
            </div>
            <ActionButton
              action={resetDemoDataAction}
              variant="outline"
              size="sm"
              confirm="Reset demo data? Your bills and subscriptions go back to the seeded demo set."
              pendingLabel="Resetting…"
            >
              <RefreshCcwIcon data-icon="inline-start" />
              Reset demo
            </ActionButton>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <ShieldAlertIcon className="size-4" />
            Danger zone
          </CardTitle>
          <CardDescription>
            Deleting your account erases bills, reminders, subscriptions and ingest history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog email={user.email} />
          <p className="mt-2 text-xs text-muted-foreground">
            Prefer to keep looking? <Link href="/app" className="underline underline-offset-2">Back to dashboard</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
