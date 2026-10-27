"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/db/store";
import type { UsageStatus } from "@/lib/types";

export async function setUsageAction(subscriptionId: string, usage: UsageStatus): Promise<void> {
  const user = await requireUser();
  await store.updateSubscriptionUsage(user.id, subscriptionId, usage);
  revalidatePath("/app");
  revalidatePath("/app/subscriptions");
}

export async function deleteSubscriptionAction(subscriptionId: string): Promise<void> {
  const user = await requireUser();
  await store.deleteSubscription(user.id, subscriptionId);
  revalidatePath("/app");
  revalidatePath("/app/subscriptions");
}
