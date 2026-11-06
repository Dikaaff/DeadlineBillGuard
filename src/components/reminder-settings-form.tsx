"use client";

import * as React from "react";
import { toast } from "sonner";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { saveReminderSettingsAction } from "@/lib/actions/settings";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

type Status = "idle" | "saving" | "saved";

export function ReminderSettingsForm({
  enabled,
  hour,
  timezone,
}: {
  enabled: boolean;
  hour: number;
  timezone: string;
}) {
  const [state, setState] = React.useState({ enabled, hour });
  const [status, setStatus] = React.useState<Status>("idle");
  const [pending, startTransition] = React.useTransition();
  const resetTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const persist = (next: { enabled: boolean; hour: number }) => {
    setState(next);
    setStatus("saving");
    startTransition(async () => {
      try {
        await saveReminderSettingsAction({
          reminderHour: next.hour,
          remindersEnabled: next.enabled,
        });
        setStatus("saved");
        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => setStatus("idle"), 2500);
      } catch {
        setStatus("idle");
        toast.error("Could not save reminder settings. Please try again.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5">
        <div className="flex flex-col gap-0.5">
          <FieldLabel htmlFor="remindersEnabled" className="font-normal">
            Email reminders
          </FieldLabel>
          <FieldDescription>
            Changes save automatically. Paused reminders stay scheduled, but nothing is sent.
          </FieldDescription>
        </div>
        <Switch
          id="remindersEnabled"
          checked={state.enabled}
          disabled={pending}
          onCheckedChange={(checked) => persist({ ...state, enabled: checked })}
        />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <Field className="w-40">
          <FieldLabel htmlFor="reminderHour">Send at</FieldLabel>
          <Select
            value={String(state.hour)}
            disabled={pending}
            onValueChange={(value) => persist({ ...state, hour: Number(value) })}
          >
            <SelectTrigger id="reminderHour" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {HOURS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {String(option).padStart(2, "0")}:00
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <p
          role="status"
          aria-live="polite"
          className="text-xs text-muted-foreground tabular-nums"
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Saves automatically"}
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Times use your timezone ({timezone}). The H-7, H-3, H-1 and H-0 schedule is unchanged — only
        the hour of the day moves.
      </p>
    </div>
  );
}
