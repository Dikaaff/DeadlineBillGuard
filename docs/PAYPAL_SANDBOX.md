# Running against the PayPal sandbox

The app works with zero credentials in simulated mode, but judges need to see the real PayPal
integration. This guide takes about 10 minutes.

## 1. Create sandbox credentials

1. Sign in to <https://developer.paypal.com/dashboard>.
2. Go to **Apps & Credentials** and make sure the **Sandbox** tab is selected.
3. Click **Create App**, name it `Deadline Bill Guard`, and create it.
4. Copy the **Client ID** and **Secret**.

Put them in `.env.local`:

```bash
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox
PAYPAL_MERCHANT_EMAIL=you@billguard.app
```

Restart the dev server. `Settings` should now show `Live sandbox` instead of `Simulated`.

## 2. Create a sandbox buyer

1. In the developer dashboard open **Testing Tools -> Sandbox Accounts**.
2. Create (or reuse) a **Personal** account. Note its email and password.
3. When PayPal asks you to log in during checkout, use this buyer account.

## 3. Test the order and capture flow locally

1. `npm run dev`
2. Open the demo, open a bill, click **Pay ... with PayPal**.
3. You are redirected to `https://www.sandbox.paypal.com/...` with the order id.
4. Log in as the sandbox buyer and approve.
5. PayPal redirects to `/api/paypal/return`, the app captures the order, marks the bill paid, and
   the bill shows a real `CAP-...` capture id.
6. The **PayPal activity** card lists `ORDER.CREATED`, `PAYMENT.CAPTURE.COMPLETED`,
   `BILL.MARKED.PAID`.

If capture fails, check the server logs and that `NEXT_PUBLIC_APP_URL` matches the origin you are
actually browsing.

## 4. Webhooks (recommended)

Webhooks make the demo resilient when the buyer closes the tab before the return URL fires.

1. Expose your local server: `ngrok http 3000` (or any tunnel).
2. Set `NEXT_PUBLIC_APP_URL=https://<your-tunnel>/` and restart.
3. In the PayPal app settings, add webhook URL `https://<your-tunnel>/api/paypal/webhook`.
4. Subscribe to **Payment capture completed** (`PAYMENT.CAPTURE.COMPLETED`).
5. Copy the **Webhook ID** into `PAYPAL_WEBHOOK_ID`.
6. Pay another bill. The webhook calls `/v1/notifications/verify-webhook-signature` and only then
   marks the bill paid.

## 5. What the integration uses

| Capability | Endpoint / API | Where |
| --- | --- | --- |
| OAuth 2.0 client credentials | `POST /v1/oauth2/token` | `src/lib/paypal.ts` |
| Create order | `POST /v2/checkout/orders` | `createPaypalOrder` |
| Capture order | `POST /v2/checkout/orders/{id}/capture` | `capturePaypalOrder` |
| Buyer return | `GET /api/paypal/return` | `src/app/api/paypal/return/route.ts` |
| Webhook verification | `POST /v1/notifications/verify-webhook-signature` | `verifyWebhook` |
| Webhook handling | `POST /api/paypal/webhook` | `src/app/api/paypal/webhook/route.ts` |

Every order is tagged with the bill id via `reference_id` and `custom_id`, which is how the return
handler and webhook find the bill to reconcile.

## Notes

- `PAYPAL_MODE=live` switches the base URL to `https://api-m.paypal.com`. Do not ship sandbox keys
  with `live`.
- The access token is cached in memory until 30 seconds before expiry.
- Webhook signatures are verified server-side; the demo-mode bypass only applies when no
  credentials are configured.
- Never commit `.env.local`.
