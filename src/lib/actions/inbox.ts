"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { ingestEmail } from "@/lib/ingest";
import { SAMPLE_EMAILS } from "@/lib/samples";

export interface IngestState {
  status: "idle" | "success" | "error";
  message: string;
  billId?: string;
  outcome?: string;
}

export async function ingestPasteAction(
  _prev: IngestState,
  formData: FormData,
): Promise<IngestState> {
  const user = await requireUser();
  const from = String(formData.get("from") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();

  if (!subject || text.length < 20) {
    return {
      status: "error",
      message: "Add a subject and at least a couple of lines of email text.",
    };
  }

  const result = await ingestEmail({
    userId: user.id,
    messageId: `paste_${randomUUID()}`,
    email: {
      from: from || "unknown@sender",
      subject,
      text,
    },
  });

  revalidatePath("/app");
  revalidatePath("/app/bills");
  revalidatePath("/app/inbox");

  if (result.outcome === "bill" && result.bill) {
    return {
      status: "success",
      message: `Added ${result.bill.merchant}. Confidence ${Math.round((result.pipeline?.confidence ?? 1) * 100)}%.`,
      billId: result.bill.id,
      outcome: result.outcome,
    };
  }

  if (result.outcome === "uncertain") {
    return {
      status: "error",
      message: "This one needs a human. It is waiting in the review queue below.",
      outcome: result.outcome,
    };
  }

  return {
    status: "error",
    message: "That does not look like a bill, so nothing was added.",
    outcome: result.outcome,
  };
}

export async function ingestSampleAction(sampleId: string): Promise<void> {
  const user = await requireUser();
  const sample = SAMPLE_EMAILS.find((item) => item.id === sampleId);
  if (!sample) return;

  await ingestEmail({
    userId: user.id,
    messageId: `sample_${sample.id}_${randomUUID()}`,
    email: { from: sample.from, subject: sample.subject, text: sample.text },
  });

  revalidatePath("/app");
  revalidatePath("/app/bills");
  revalidatePath("/app/inbox");
}
