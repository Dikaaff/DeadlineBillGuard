# Deadline Bill Guard - hackathon submission

Copy the sections below into the submission form.

## Short description

Deadline Bill Guard is an AI-powered bill inbox. Forward an invoice email, an LLM pipeline
extracts the merchant, amount, currency, due date and invoice number, and the app schedules
reminders before the deadline. When you are ready to pay, it opens a PayPal Orders v2 checkout,
captures the payment, and reconciles the capture through a verified webhook. The result is one
place that answers: what is due, what is overdue, and which subscriptions are quietly draining
your account.

## What it does

1. **Email-to-bill ingestion.** Every user gets a forwarding address. A sample form and an inbound
   webhook feed the same pipeline, so the demo works without a mail provider.
2. **Two-stage AI extraction.** A classifier rejects non-bill mail; an extractor returns structured
   fields. The output is validated with Zod, cross-checked against a deterministic parser, and
   scored for confidence. Anything under 60% goes to a human review queue.
3. **Reminder ladder.** Four reminders per bill (H-7, H-3, H-1, H-0), delivered by a cron endpoint
   through Resend (logged locally when no key is set).
4. **PayPal checkout.** Orders v2 create + capture, buyer return URL, server-side webhook signature
   verification, and a per-bill PayPal audit trail.
5. **Subscription radar.** Recurring merchants are grouped so unused plans show up as a yearly
   recoverable number.
6. **CSV export and data ownership.** No bank credentials and no scraping; everything is
   exportable.

## Tools and how they are used

| Tool | Role in the project |
| --- | --- |
| **PayPal Orders v2 API** | Creates the order with the bill id as `reference_id`/`custom_id`, redirects the payer to PayPal approval, captures on return. |
| **PayPal Webhooks** | Receives `PAYMENT.CAPTURE.COMPLETED`, verifies the signature through `/v1/notifications/verify-webhook-signature`, then reconciles the bill. |
| **Groq (Llama 3.3 70B)** | Primary LLM for the bill classifier and field extractor, using JSON-mode responses. |
| **Google Gemini (2.0 Flash)** | Automatic fallback provider if Groq is unavailable or not configured. |
| **Zod** | Runtime validation of every LLM response before it can create a bill. |
| **Deterministic heuristic parser** | Cross-checks LLM output and keeps the app fully usable with no AI key (demo/offline mode). |
| **Next.js 16 / React 19 / Tailwind v4 / shadcn-style UI** | Application framework and interface. |
| **Resend** | Reminder email delivery; logged instead of sent when no key is present. |

The AI layer is in `src/lib/ai/` and the PayPal layer in `src/lib/paypal.ts`.

## How to run (judges)

```bash
npm install
Copy-Item .env.example .env.local   # optional: add keys for live AI/PayPal
npm run dev
```

Open <http://localhost:3000> and click **Open the demo**. No credentials are required: the store is
seeded, AI falls back to the heuristic parser, PayPal returns simulated `SIM-`/`CAP-SIM-` ids, and
reminder emails are logged. To exercise the real sandbox, follow `docs/PAYPAL_SANDBOX.md`.

## Links

- Repository: <https://github.com/Dikaaff/DeadlineBillGuard>
- Demo video: _add YouTube link before submitting_
- Hosted demo: _add URL before submitting (optional if judges run locally)_

## Manual checklist before submission

- [x] Public repository with source code
- [x] LICENSE file (MIT)
- [x] Setup instructions that work with no credentials
- [x] Working prototype (typecheck, lint and production build pass)
- [x] PayPal + AI are both meaningful and documented
- [ ] Demo video under 3 minutes on YouTube (public) - use `docs/DEMO_SCRIPT.md`
- [ ] Screenshots added to the README (dashboard, inbox, bill detail, PayPal activity)
- [ ] Hosted demo URL (optional, recommended) with a persistent `DBG_DATA_DIR`
- [ ] GitHub repo About: description, license, topics, website
- [ ] Run one real PayPal sandbox payment end to end and record it
