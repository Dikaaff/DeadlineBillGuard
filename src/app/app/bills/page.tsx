import Link from "next/link";
import { DownloadIcon, PlusIcon, SearchIcon } from "lucide-react";
import { BillStatusBadge } from "@/components/bill-status-badge";
import { CategoryIcon } from "@/components/category-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { store } from "@/lib/db/store";
import {
  CATEGORY_LABELS,
  categoryLabel,
  dueLabel,
  formatDate,
  formatMoney,
  formatMoneyWhole,
} from "@/lib/format";
import type { BillCategory, BillFilters, BillStatus } from "@/lib/types";
import { cn } from "cn";

export const metadata = { title: "Bills" };

const STATUS_TABS: Array<{ value: BillStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Scheduled" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
];

const CATEGORIES = Object.keys(CATEGORY_LABELS) as BillCategory[];

function queryHref(params: {
  status?: string;
  category?: string;
  q?: string;
  sort?: string;
}): string {
  const search = new URLSearchParams();
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.category && params.category !== "all") search.set("category", params.category);
  if (params.q) search.set("q", params.q);
  if (params.sort && params.sort !== "due") search.set("sort", params.sort);
  const value = search.toString();
  return value ? `/app/bills?${value}` : "/app/bills";
}

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const status = (typeof params.status === "string" ? params.status : "all") as BillStatus | "all";
  const category = (typeof params.category === "string" ? params.category : "all") as BillCategory | "all";
  const q = typeof params.q === "string" ? params.q : "";
  const sort = (typeof params.sort === "string" ? params.sort : "due") as BillFilters["sort"];

  const bills = await store.listBills(user.id, { status, category, query: q, sort });
  const open = bills.filter((bill) => bill.status === "pending" || bill.status === "overdue");
  const openTotal = open.reduce((sum, bill) => sum + bill.amountCents, 0);

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Bills</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {bills.length} bill{bills.length === 1 ? "" : "s"} ·{" "}
            {formatMoneyWhole(openTotal)} still open
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/api/bills/export" download>
              <DownloadIcon data-icon="inline-start" />
              Export CSV
            </a>
          </Button>
          <Button asChild size="sm">
            <Link href="/app/bills/new">
              <PlusIcon data-icon="inline-start" />
              Add bill
            </Link>
          </Button>
        </div>
      </div>

      <Card className="gap-0">
        <CardContent className="flex flex-col gap-3 pt-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_TABS.map((tab) => {
              const active = status === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={queryHref({ status: tab.value, category, q, sort })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-primary/20 bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <form action="/app/bills" className="flex items-center gap-2">
                {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
                {sort !== "due" ? <input type="hidden" name="sort" value={sort} /> : null}
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="q"
                    defaultValue={q}
                    placeholder="Search merchant or invoice"
                    className="h-8 w-52 pl-8 text-xs"
                  />
                </div>
                <Select name="category" defaultValue={category}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All categories</SelectItem>
                      {CATEGORIES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {CATEGORY_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button type="submit" variant="outline" size="sm">
                  Filter
                </Button>
              </form>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Sort</span>
            {(
              [
                { value: "due", label: "Due date" },
                { value: "amount", label: "Amount" },
                { value: "recent", label: "Recently added" },
              ] as const
            ).map((option) => (
              <Link
                key={option.value}
                href={queryHref({ status, category, q, sort: option.value })}
                className={cn(
                  "rounded-md px-1.5 py-0.5 transition-colors",
                  sort === option.value
                    ? "bg-muted font-medium text-foreground"
                    : "hover:text-foreground",
                )}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {bills.length === 0 ? (
        <Card>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon />
              </EmptyMedia>
              <EmptyTitle>No bills match this view</EmptyTitle>
              <EmptyDescription>
                Try a different status or category, or add a bill by hand.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/app/bills/new">Add a bill</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[34%] pl-5">Merchant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-5 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id} className="cursor-pointer">
                    <TableCell className="pl-5">
                      <Link href={`/app/bills/${bill.id}`} className="flex items-center gap-3">
                        <CategoryIcon category={bill.category} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium">{bill.merchant}</span>
                            {bill.isSubscription ? (
                              <Badge
                                variant="secondary"
                                className="h-4 px-1.5 text-[10px] font-normal"
                              >
                                Recurring
                              </Badge>
                            ) : null}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {bill.invoiceId ?? "No invoice number"}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {categoryLabel(bill.category)}
                    </TableCell>
                    <TableCell>
                      <span className="block text-sm">{formatDate(bill.dueDate)}</span>
                      <span className="block text-xs text-muted-foreground">
                        {dueLabel(bill.dueDate, bill.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <BillStatusBadge bill={bill} />
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <span className="tabular text-sm font-medium">
                        {formatMoney(bill.amountCents, bill.currency)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col divide-y divide-border md:hidden">
            {bills.map((bill) => (
              <Link
                key={bill.id}
                href={`/app/bills/${bill.id}`}
                className="flex items-center gap-3 px-4 py-3.5"
              >
                <CategoryIcon category={bill.category} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{bill.merchant}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(bill.dueDate)} · {dueLabel(bill.dueDate, bill.status)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="tabular text-sm font-medium">
                    {formatMoney(bill.amountCents, bill.currency)}
                  </p>
                  <BillStatusBadge bill={bill} />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
