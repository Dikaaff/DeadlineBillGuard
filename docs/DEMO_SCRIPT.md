# Demo video script (under 3 minutes)

Target length: 2:30. Record at 1440x900 or larger, 1080p, browser zoom 100%.
Use the demo account (`Open the demo` on the landing page) so the store is seeded.

## 0:00-0:15 - Hook

**Show:** Landing page hero.

**Say:** "People do not miss bills because they are careless. They miss them because bills
arrive as email. Deadline Bill Guard turns a forwarded invoice into a structured bill, reminds
you before the due date, and lets you pay it with PayPal without leaving the app."

## 0:15-0:35 - Dashboard

**Show:** Click `Open the demo` -> dashboard. Scroll the due/overdue lists and the monthly
subscription runway.

**Say:** "The dashboard is the one screen that answers: what is due, what is late, and how much
recurring spend is quietly leaving every month."

## 0:35-1:10 - AI extraction

**Show:** Open `Inbox`. Click a sample email button (for example the utility invoice). Then open
the created bill.

**Say:** "Inbox ingestion runs a two-stage AI pipeline. A classifier decides whether the message
is even a bill. An extractor pulls merchant, amount, currency, due date, invoice number and
category. Every field is validated with Zod, cross-checked against a deterministic parser, and
scored. If confidence is under 60 percent the email goes to a human review queue instead of
silently creating a wrong bill."

**Show:** The bill detail page: amount, due date, extraction confidence, source email snippet.

## 1:10-1:45 - PayPal checkout

**Show:** In the bill detail, click `Pay ... with PayPal`. In sandbox mode you land on PayPal's
approval page, log in with the sandbox buyer, approve. You return to the bill marked paid.

**Say:** "PayPal is the payment rail, not an afterthought. The app creates an Orders v2 order with
the bill id as reference, sends the payer to PayPal for approval, captures the order on return,
and reconciles the capture through the webhook. Every order, capture and webhook is written to an
audit trail on the bill."

**Show:** The `PayPal activity` card listing `ORDER.CREATED`, `PAYMENT.CAPTURE.COMPLETED` and
`BILL.MARKED.PAID`, plus the capture id.

> If you are recording without PayPal credentials, the same flow runs in simulated mode
> (`SIM-` order id, `CAP-SIM-` capture id) and the banner explains it.

## 1:45-2:05 - Reminders and subscriptions

**Show:** Back on the bill, the reminder ladder (H-7, H-3, H-1, H-0). Open `Subscriptions`, flag a
plan as unused and show the yearly recoverable total.

**Say:** "Four reminders are scheduled per bill. Recurring merchants are grouped into
subscriptions, so the plans you forgot about show up as a yearly number instead of a line item."

## 2:05-2:20 - Export and data ownership

**Show:** `Settings` -> `Download CSV`.

**Say:** "Everything is exportable as CSV. No bank credentials, no scraping: the inbox you already
use is the source of truth."

## 2:20-2:30 - Close

**Show:** Landing page or dashboard, then the repository URL.

**Say:** "Deadline Bill Guard. Forward a bill, get reminded, pay with PayPal. Source and setup
instructions are in the repository."

## Recording checklist

- [ ] `npm run build && npm run start` (record the production build, not dev)
- [ ] Demo data reset so the dashboard looks populated
- [ ] Sandbox PayPal account ready if showing the real redirect
- [ ] Browser notifications/other tabs closed
- [ ] Upload to YouTube as **Public**, under 3:00
- [ ] No third-party music or trademarks beyond normal PayPal UI usage
