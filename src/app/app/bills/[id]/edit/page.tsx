import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { BillForm } from "@/components/bill-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/db/store";

export const metadata = { title: "Edit bill" };

export default async function EditBillPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const bill = await store.getBill(user.id, id);
  if (!bill) notFound();

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href={`/app/bills/${bill.id}`}>
            <ArrowLeftIcon data-icon="inline-start" />
            {bill.merchant}
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">Edit bill</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fix anything the parser got wrong. Saving resets the reminder schedule.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bill details</CardTitle>
          <CardDescription>Changes take effect immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          <BillForm bill={bill} />
        </CardContent>
      </Card>
    </div>
  );
}
