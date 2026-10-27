export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export function emailStatus() {
  return {
    provider: process.env.RESEND_API_KEY ? ("resend" as const) : ("console" as const),
    from: process.env.REMINDER_FROM ?? "Bill Guard <reminders@billguard.app>",
  };
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<{ sent: boolean; provider: "resend" | "console"; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.info(`[reminder] ${input.subject} -> ${input.to} (console transport)`);
    return { sent: false, provider: "console" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.REMINDER_FROM ?? "Bill Guard <reminders@billguard.app>",
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return { sent: false, provider: "resend", error: await response.text() };
    }
    return { sent: true, provider: "resend" };
  } catch (error) {
    return {
      sent: false,
      provider: "resend",
      error: error instanceof Error ? error.message : "unknown error",
    };
  }
}

export function reminderEmailHtml(input: {
  name: string;
  merchant: string;
  amount: string;
  dueLabel: string;
  appUrl: string;
  billId: string;
  offsetDays: number;
}): string {
  const urgency =
    input.offsetDays === 0
      ? "is due today"
      : input.offsetDays === 1
        ? "is due tomorrow"
        : `is due in ${input.offsetDays} days`;
  return `<!doctype html>
<html><body style="margin:0;background:#f8f6f0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;color:#1f2d27">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px">
    <p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b7a72;margin:0 0 20px">Deadline Bill Guard</p>
    <h1 style="font-size:26px;line-height:1.2;margin:0 0 12px">${input.merchant} ${urgency}</h1>
    <p style="margin:0 0 24px;color:#4b5a53">${input.name}, ${input.amount} leaves your account on ${input.dueLabel}. You still have time to check it.</p>
    <a href="${input.appUrl}/app/bills/${input.billId}" style="display:inline-block;background:#1d4a3a;color:#f8f6f0;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600">Open the bill</a>
    <p style="margin:28px 0 0;font-size:12px;color:#7b8880">You are receiving this because you forwarded this bill to Bill Guard. Turn reminders off in Settings.</p>
  </div>
</body></html>`;
}
