import { randomUUID } from "node:crypto";
import type { Bill } from "@/lib/types";

const PAYPAL_LIVE = "https://api-m.paypal.com";
const PAYPAL_SANDBOX = "https://api-m.sandbox.paypal.com";

type TokenCache = { token: string; expiresAt: number } | null;
let tokenCache: TokenCache = null;

export type PaypalMode = "live" | "sandbox" | "demo";

export function paypalMode(): PaypalMode {
  const configured = Boolean(
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET,
  );
  if (!configured) return "demo";
  return process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";
}

export function paypalStatus() {
  return {
    mode: paypalMode(),
    configured: paypalMode() !== "demo",
    webhookConfigured: Boolean(process.env.PAYPAL_WEBHOOK_ID),
    merchantEmail: process.env.PAYPAL_MERCHANT_EMAIL ?? null,
  };
}

function apiBase(): string {
  return paypalMode() === "live" ? PAYPAL_LIVE : PAYPAL_SANDBOX;
}

async function accessToken(): Promise<string | null> {
  if (paypalMode() === "demo") return null;
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.token;
  }
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3000) * 1000,
  };
  return data.access_token;
}

export interface CreatedOrder {
  id: string;
  approveUrl: string;
  mode: PaypalMode;
}

export async function createPaypalOrder(
  bill: Bill,
  options: { appUrl: string },
): Promise<CreatedOrder> {
  const mode = paypalMode();
  if (mode === "demo") {
    const id = `SIM-${randomUUID().slice(0, 8).toUpperCase()}`;
    return { id, approveUrl: `/app/checkout/${id}`, mode };
  }

  const token = await accessToken();
  if (!token) throw new Error("PayPal authentication failed");

  const value = (bill.amountCents / 100).toFixed(2);
  const purchaseUnit: Record<string, unknown> = {
    reference_id: bill.id,
    custom_id: bill.id,
    description: `${bill.merchant} bill due ${bill.dueDate}`.slice(0, 127),
    amount: { currency_code: bill.currency, value },
  };
  if (process.env.PAYPAL_MERCHANT_EMAIL) {
    purchaseUnit.payee = { email_address: process.env.PAYPAL_MERCHANT_EMAIL };
  }

  const response = await fetch(`${apiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `order-${bill.id}-${Date.now()}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [purchaseUnit],
      application_context: {
        brand_name: "Deadline Bill Guard",
        user_action: "PAY_NOW",
        return_url: `${options.appUrl}/api/paypal/return`,
        cancel_url: `${options.appUrl}/app/bills/${bill.id}?paypal=cancelled`,
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`PayPal order failed: ${detail.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    id: string;
    links?: Array<{ rel: string; href: string }>;
  };
  const approveUrl = data.links?.find((link) => link.rel === "approve")?.href;
  if (!approveUrl) throw new Error("PayPal did not return an approval link");

  return { id: data.id, approveUrl, mode };
}

export interface CapturedOrder {
  orderId: string;
  captureId: string;
  status: string;
}

export async function capturePaypalOrder(orderId: string): Promise<CapturedOrder> {
  if (paypalMode() === "demo") {
    return {
      orderId,
      captureId: `CAP-SIM-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: "COMPLETED",
    };
  }

  const token = await accessToken();
  if (!token) throw new Error("PayPal authentication failed");

  const response = await fetch(`${apiBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `capture-${orderId}`,
    },
    signal: AbortSignal.timeout(15_000),
  });

  const data = (await response.json()) as {
    status?: string;
    purchase_units?: Array<{
      payments?: { captures?: Array<{ id?: string; status?: string }> };
    }>;
  };

  if (!response.ok) {
    throw new Error(`PayPal capture failed: ${JSON.stringify(data).slice(0, 200)}`);
  }

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    orderId,
    captureId: capture?.id ?? `UNKNOWN-${orderId}`,
    status: capture?.status ?? data.status ?? "UNKNOWN",
  };
}

export interface WebhookHeaders {
  transmissionId: string | null;
  transmissionTime: string | null;
  certUrl: string | null;
  authAlgo: string | null;
  transmissionSig: string | null;
}

export async function verifyWebhook(
  headers: WebhookHeaders,
  rawBody: string,
): Promise<boolean> {
  if (paypalMode() === "demo") return true;
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  if (
    !headers.transmissionId ||
    !headers.transmissionTime ||
    !headers.certUrl ||
    !headers.authAlgo ||
    !headers.transmissionSig
  ) {
    return false;
  }

  const token = await accessToken();
  if (!token) return false;

  const response = await fetch(
    `${apiBase()}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transmission_id: headers.transmissionId,
        transmission_time: headers.transmissionTime,
        cert_url: headers.certUrl,
        auth_algo: headers.authAlgo,
        transmission_sig: headers.transmissionSig,
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody),
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) return false;
  const data = (await response.json()) as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}
