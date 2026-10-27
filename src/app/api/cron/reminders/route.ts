import { NextResponse } from "next/server";
import { appUrl } from "@/lib/app-url";
import { runReminderJob } from "@/lib/reminders";

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const url = new URL(request.url);
  const provided =
    url.searchParams.get("secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return provided === secret;
}

async function run(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await runReminderJob(appUrl());
  return NextResponse.json(summary);
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
