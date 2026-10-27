"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, requireUser } from "@/lib/auth";
import { store } from "@/lib/db/store";
import type { CurrencyCode } from "@/lib/types";

const CURRENCIES: CurrencyCode[] = [
  "USD", "EUR", "GBP", "IDR", "SGD", "INR", "PHP", "AUD", "CAD", "MYR", "THB", "BRL", "MXN",
];

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  currency: z.enum(CURRENCIES as [CurrencyCode, ...CurrencyCode[]]),
  timezone: z.string().trim().min(1).max(60),
  reminders: z.boolean().optional(),
});

export async function updateProfileAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = profileSchema.parse({
    name: String(formData.get("name") ?? ""),
    currency: String(formData.get("currency") ?? "USD"),
    timezone: String(formData.get("timezone") ?? "America/Los_Angeles"),
    reminders: formData.get("reminders") === "on",
  });
  await store.updateUser(user.id, {
    name: parsed.name,
    currency: parsed.currency,
    timezone: parsed.timezone,
  });
  revalidatePath("/app/settings");
  revalidatePath("/app");
  redirect("/app/settings?saved=1");
}

export async function deleteAccountAction(): Promise<void> {
  const user = await requireUser();
  await store.deleteAccount(user.id);
  await endSession();
  redirect("/");
}

export async function resetDemoDataAction(): Promise<void> {
  await store.reset();
  revalidatePath("/app");
  revalidatePath("/app/bills");
  revalidatePath("/app/subscriptions");
  revalidatePath("/app/inbox");
  revalidatePath("/app/settings");
  redirect("/app");
}
