import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";
import { ingestEmail } from "@/lib/ingest";

export async function POST(request: Request) {
  const secret = process.env.INBOUND_EMAIL_SECRET;
  if (secret) {
    const provided =
      request.headers.get("x-inbound-secret") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const contentType = request.headers.get("content-type") ?? "";
  const payload: Record<string, string> = {};

  if (contentType.includes("application/json")) {
    const json = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!json) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    for (const key of ["to", "from", "subject", "text", "messageId"]) {
      const value = json[key];
      if (typeof value === "string") payload[key] = value;
    }
  } else {
    const form = await request.formData();
    for (const key of ["to", "from", "subject", "text", "messageId"]) {
      const value = form.get(key);
      if (typeof value === "string") payload[key] = value;
    }
  }

  const to = payload.to?.trim();
  const from = payload.from?.trim();
  const subject = payload.subject?.trim();
  const text = payload.text?.trim();

  if (!to || !from || !subject || !text) {
    return NextResponse.json(
      { error: "to, from, subject and text are required" },
      { status: 400 },
    );
  }

  const user = await store.findUserByInboundAddress(to);
  if (!user) {
    return NextResponse.json({ error: "Unknown forwarding address" }, { status: 404 });
  }

  const result = await ingestEmail({
    userId: user.id,
    messageId: payload.messageId ?? null,
    email: { from, subject, text },
  });

  return NextResponse.json({
    outcome: result.outcome,
    billId: result.bill?.id ?? null,
    merchant: result.bill?.merchant ?? null,
    confidence: result.pipeline?.confidence ?? null,
  });
}
