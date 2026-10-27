# Deadline Bill Guard

Track recurring bills, catch renewals before they hit, and stop paying for things you forgot about.

Deadline Bill Guard is a small Next.js app for keeping every due date, subscription, and invoice in one place. Forward a bill email and it extracts the merchant, amount, and due date; the dashboard shows what's due next, what's overdue, and how much of your monthly spend is tied up in subscriptions.

## Features

- **Bill tracking** — create, edit, and pay bills with merchant, category, amount, currency, due date, and status (`pending`, `paid`, `overdue`, `cancelled`).
- **Subscriptions view** — separate recurring subscriptions from one-off bills and see monthly runway.
- **Inbox ingestion** — forward bill emails to a per-user inbound address; the app parses the message into a bill draft (with heuristic fallbacks when no AI provider is configured).
- **Email reminders** — a cron-triggered job emails reminders for upcoming and overdue bills via Resend.
- **CSV export** — download all of your bills as CSV.
- **PayPal checkout** — pay a bill through PayPal (orders + capture) with webhook reconciliation.
- **Demo mode** — with no PayPal credentials the app issues mock `SIM-` / `CAP-` order ids so checkout flows still work locally.
- **Themes** — light/dark via `next-themes`.

Supported currencies: USD, EUR, GBP, IDR, SGD, INR, PHP, AUD, CAD, MYR, THB, BRL, MXN.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS v4, shadcn-style components on Radix primitives |
| Icons / motion | `lucide-react`, `tw-animate-css` |
| Charts | Recharts |
| Dates | `date-fns`, `react-day-picker` |
| Validation | Zod |
| Email | Resend |
| Payments | PayPal Orders API |
| Storage | File-backed JSON store in `.data/` (no external database required) |

> This project pins Next.js 16.4.3. That release line has breaking changes versus older App Router versions — check `node_modules/next/dist/docs/` before changing routing or config code.

## Getting started

**Prerequisites:** Node.js 20+ and npm.

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.example .env.local   # Windows PowerShell: Copy-Item .env.example .env.local

# 3. Start the dev server
npm run dev
```

Open <http://localhost:3000>. The app runs without any third-party credentials: email is logged instead of sent, PayPal runs in demo mode, and data is written to `.data/`.

## Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `npm run dev` | `next dev` | Start the development server |
| `npm run build` | `next build` | Production build |
| `npm run start` | `next start` | Serve the production build |
| `npm run lint` | `eslint` | Lint the codebase |
| `npm run typecheck` | `tsc --noEmit` | Type-check without emitting |
| `npm run typegen` | `next typegen` | Generate Next.js route types |

## Project structure

```text
src/
├─ app/
│  ├─ page.tsx                 # Landing page
│  ├─ login/                   # Sign-in
│  ├─ app/                     # Authenticated area
│  │  ├─ page.tsx              # Dashboard
│  │  ├─ bills/                # List, new, detail, edit
│  │  ├─ subscriptions/        # Recurring subscriptions
│  │  ├─ inbox/                # Forwarded-email ingestion
│  │  ├─ checkout/[orderId]/   # PayPal checkout
│  │  └─ settings/             # Account + inbound address
│  └─ api/                     # Route handlers (see below)
├─ components/                 # App components + ui/ primitives
├─ hooks/                      # Client hooks
├─ lib/
│  ├─ ai/                      # Extraction pipeline, provider, heuristics, prompts
│  ├─ db/store.ts              # File-backed JSON store
│  ├─ actions/                 # Server actions
│  ├─ session.ts               # Session/AUTH_SECRET handling
│  ├─ email.ts, reminders.ts   # Resend integration + reminder job
│  ├─ paypal.ts                # Orders, capture, webhook verification
│  ├─ ingest.ts                # Inbound email parsing/ingestion
│  └─ types.ts                 # Domain types
└─ proxy.ts                    # Request proxy
```

Runtime data lives in `.data/` by default and is not committed.

## API routes

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/bills/export` | Session | Stream all of the signed-in user's bills as CSV. |
| `GET`, `POST` | `/api/cron/reminders` | `CRON_SECRET` (when set) | Run the reminder job and return a summary. |
| `POST` | `/api/email/inbound` | `INBOUND_EMAIL_SECRET` (when set) | Accept a forwarded email (JSON or form data) and turn it into a bill. |
| `GET` | `/api/paypal/return` | Session | PayPal return URL: captures the order and marks the bill paid. |
| `POST` | `/api/paypal/webhook` | PayPal signature verification | Handle `PAYMENT.CAPTURE.COMPLETED` events. |

`/api/cron/reminders` accepts the secret either as `?secret=...` or an `Authorization: Bearer ...` header. `/api/email/inbound` accepts it as an `x-inbound-secret` header or a Bearer token.

## Environment variables

Copy `.env.example` to `.env.local` and fill in what you need. Nothing is required to run locally.

| Variable | Default | Purpose |
| --- | --- | --- |
| `AUTH_SECRET` | dev fallback | Session signing secret. Generate with `openssl rand -base64 32`. **Required in production.** |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public base URL used in links and absolute URLs. |
| `NODE_ENV` | `development` | Standard Node environment flag. |
| `VERCEL_URL` | — | Injected by Vercel automatically; leave unset locally. |
| `CRON_SECRET` | empty | Shared secret for `/api/cron/reminders`. Empty leaves the endpoint open (fine for local use). |
| `DBG_DATA_DIR` | `./.data` | Directory for the file-backed JSON store. |
| `RESEND_API_KEY` | empty | Resend API key. Without it, reminder emails are logged and suppressed for `@billguard.app` test addresses. |
| `REMINDER_FROM` | `Bill Guard <reminders@billguard.app>` | From address for reminder emails. |
| `PAYPAL_CLIENT_ID` | empty | PayPal app client id. |
| `PAYPAL_CLIENT_SECRET` | empty | PayPal app secret. |
| `PAYPAL_MODE` | `sandbox` | `live` for production; anything else uses sandbox. |
| `PAYPAL_MERCHANT_EMAIL` | `you@billguard.app` | Merchant email used by the checkout flow. |
| `PAYPAL_WEBHOOK_ID` | empty | Webhook id used to verify signatures on `/api/paypal/webhook`. |
| `INBOUND_EMAIL_SECRET` | empty | Optional shared secret for `/api/email/inbound`. Not listed in `.env.example`; set it yourself if you expose the endpoint publicly. |

Without PayPal credentials the app runs in demo mode and returns mock `SIM-` / `CAP-` order ids instead of contacting PayPal.

## Deployment

1. Set `AUTH_SECRET` and `NEXT_PUBLIC_APP_URL` to production values.
2. Build and run:
   ```bash
   npm run build
   npm run start
   ```
3. **Reminders:** schedule a request to `https://<your-domain>/api/cron/reminders` (Vercel Cron or any scheduler) and set `CRON_SECRET` so only your scheduler can trigger it.
4. **PayPal:** set `PAYPAL_MODE=live`, add `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_WEBHOOK_ID`, then register `https://<your-domain>/api/paypal/webhook` as the webhook URL in the PayPal developer dashboard.
5. **Email:** set `RESEND_API_KEY` and a verified `REMINDER_FROM` sender for outbound reminders; set `INBOUND_EMAIL_SECRET` before pointing a mail provider at `/api/email/inbound`.

Data is stored on the local filesystem (`.data/` by default). On platforms with ephemeral disks, mount a persistent volume or point `DBG_DATA_DIR` at persistent storage.
