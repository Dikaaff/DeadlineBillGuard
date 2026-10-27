import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { store } from "@/lib/db/store";

function escapeCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bills = await store.listBills(user.id, { sort: "due" });
  const header = [
    "id",
    "merchant",
    "category",
    "amount",
    "currency",
    "due_date",
    "status",
    "invoice_id",
    "is_subscription",
    "confidence",
    "paid_at",
    "created_at",
  ];

  const rows = bills.map((bill) =>
    [
      bill.id,
      bill.merchant,
      bill.category,
      (bill.amountCents / 100).toFixed(2),
      bill.currency,
      bill.dueDate,
      bill.status,
      bill.invoiceId,
      bill.isSubscription ? "yes" : "no",
      bill.extractionConfidence.toFixed(2),
      bill.paidAt,
      bill.createdAt,
    ]
      .map(escapeCell)
      .join(","),
  );

  const body = [header.join(","), ...rows].join("\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bill-guard-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
