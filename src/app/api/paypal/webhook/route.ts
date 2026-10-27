import { NextResponse } from "next/server";
import { store } from "@/lib/db/store";
import { verifyWebhook } from "@/lib/paypal";

type PaypalWebhook = {
  id?: string;
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
    amount?: { value?: string; currency_code?: string };
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verified = await verifyWebhook(
    {
      transmissionId: request.headers.get("paypal-transmission-id"),
      transmissionTime: request.headers.get("paypal-transmission-time"),
      certUrl: request.headers.get("paypal-cert-url"),
      authAlgo: request.headers.get("paypal-auth-algo"),
      transmissionSig: request.headers.get("paypal-transmission-sig"),
    },
    rawBody,
  );

  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaypalWebhook;
  try {
    event = JSON.parse(rawBody) as PaypalWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
  if (!orderId || !event.id) {
    return NextResponse.json({ received: true, ignored: true });
  }

  await store.logPaypalEvent({
    eventId: event.id,
    eventType: event.event_type ?? "UNKNOWN",
    billId: null,
    payload: (event.resource ?? {}) as Record<string, unknown>,
  });

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const bill = await store.findBillByPaypalOrderId(orderId);
    if (bill && bill.status !== "paid") {
      const captureId = event.resource?.id ?? null;
      await store.markBillPaid(bill.userId, bill.id, captureId, orderId);
      await store.logPaypalEvent({
        eventId: `webhook-capture-${event.id}`,
        eventType: "BILL.MARKED.PAID",
        billId: bill.id,
        payload: { orderId, captureId, amount: event.resource?.amount ?? null },
      });
    }
  }

  return NextResponse.json({ received: true });
}
