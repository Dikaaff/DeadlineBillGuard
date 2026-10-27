"use server";

import { redirect } from "next/navigation";
import { endSession, signInAsDemo, signInWithEmail } from "@/lib/auth";

export interface AuthState {
  error: string | null;
}

export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const name = String(formData.get("name") ?? "");
  try {
    await signInWithEmail(email, name || undefined);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not sign in." };
  }
  redirect("/app");
}

export async function demoSignInAction(): Promise<void> {
  await signInAsDemo();
  redirect("/app");
}

export async function signOutAction(): Promise<void> {
  await endSession();
  redirect("/");
}
