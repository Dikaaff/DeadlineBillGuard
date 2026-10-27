import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/db/store";
import { capturePaypalOrder } from "@/lib/paypal";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId") ?? url.searchParams.get("token");
  const user = await getSession();
  const appUrl = url.origin;

  if (!user) return NextResponse.redirect(new URL("/login", appUrl));
  if (!orderId) return NextResponse.redirect(new URL("/app/bills", appUrl));

  const bill = await store.findBillByPaypalOrderId(orderId);
  if (!bill || bill.userId !== user.id) {
    return NextResponse.redirect(new URL("/app/bills", appUrl));
  }

  if (bill.status === "paid") {
    return NextResponse.redirect(
      new URL(`/app/bills/${bill.id}?paypal=already-paid`, appUrl),
    );
  }

  try {
    const capture = await capturePaypalOrder(orderId);
    await store.markBillPaid(user.id, bill.id, capture.captureId, orderId);
    await store.logPaypalEvent({
      eventId: `capture-${capture.captureId}`,
      eventType: "PAYMENT.CAPTURE.COMPLETED",
      billId: bill.id,
      payload: { orderId, captureId: capture.captureId, source: "return-url" },
    });
    return NextResponse.redirect(new URL(`/app/bills/${bill.id}?paypal=success`, appUrl));
  } catch {
    return NextResponse.redirect(new URL(`/app/bills/${bill.id}?paypal=failed`, appUrl));
  }
}
