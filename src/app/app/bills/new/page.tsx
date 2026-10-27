import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { BillForm } from "@/components/bill-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Add a bill" };

export default function NewBillPage() {
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/app/bills">
            <ArrowLeftIcon data-icon="inline-start" />
            Bills
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">Add a bill</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          For the bills that never hit your inbox. You can also forward any invoice email
          instead — the AI parses it for you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bill details</CardTitle>
          <CardDescription>
            Everything here feeds the reminder schedule and the payment link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillForm />
        </CardContent>
      </Card>
    </div>
  );
}
