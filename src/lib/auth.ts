import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/lib/types";
import { store } from "@/lib/db/store";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  verifySessionToken,
} from "@/lib/session";

export async function getSession(): Promise<User | null> {
  const jar = await cookies();
  const payload = verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  return store.getUserById(payload.userId);
}

export async function requireUser(): Promise<User> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function startSession(user: User): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken({ userId: user.id, email: user.email }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  await store.ensureConnection(user.id, user.email);
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function signInWithEmail(email: string, name?: string): Promise<User> {
  const normalised = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
    throw new Error("Enter a valid email address.");
  }
  const existing = await store.getUserByEmail(normalised);
  const user = existing ?? (await store.createUser(normalised, name ?? ""));
  await startSession(user);
  return user;
}

export async function signInAsDemo(): Promise<User> {
  const demo = await store.getUserByEmail("you@billguard.app");
  if (!demo) {
    await store.reset();
    const seeded = await store.getUserByEmail("you@billguard.app");
    if (!seeded) throw new Error("Demo data unavailable");
    await startSession(seeded);
    return seeded;
  }
  await startSession(demo);
  return demo;
}
