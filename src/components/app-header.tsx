"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon, LogOutIcon, PlusIcon, Settings2Icon, UserIcon } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatusDot } from "@/components/bill-status-badge";

export interface HeaderReminder {
  id: string;
  billId: string;
  merchant: string;
  amount: string;
  when: string;
  due: string;
}

const TITLES: Array<{ match: (path: string) => boolean; title: string }> = [
  { match: (p) => p === "/app", title: "Overview" },
  { match: (p) => p === "/app/bills/new", title: "New bill" },
  { match: (p) => /^\/app\/bills\/[^/]+$/.test(p), title: "Bill detail" },
  { match: (p) => p.startsWith("/app/bills"), title: "Bills" },
  { match: (p) => p.startsWith("/app/subscriptions"), title: "Subscriptions" },
  { match: (p) => p.startsWith("/app/inbox"), title: "Inbox" },
  { match: (p) => p.startsWith("/app/settings"), title: "Settings" },
  { match: (p) => p.startsWith("/app/checkout"), title: "Checkout" },
];

export function AppHeader({
  user,
  reminders,
}: {
  user: { name: string; email: string; initials: string };
  reminders: HeaderReminder[];
}) {
  const pathname = usePathname();
  const title = TITLES.find((item) => item.match(pathname))?.title ?? "Overview";

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5 data-[orientation=vertical]:h-5" />
      <h2 className="text-sm font-medium text-foreground">{title}</h2>

      <div className="ml-auto flex items-center gap-1.5">
        {pathname !== "/app/bills/new" ? (
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/app/bills/new">
              <PlusIcon data-icon="inline-start" />
              Add bill
            </Link>
          </Button>
        ) : null}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Reminders">
              <BellIcon />
              {reminders.length > 0 ? (
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-status-due ring-2 ring-background" />
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-medium">Reminders</p>
              <span className="text-xs text-muted-foreground">{reminders.length} upcoming</span>
            </div>
            <Separator />
            {reminders.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Nothing scheduled. We will nudge you 7, 3 and 1 day before each bill.
              </p>
            ) : (
              <ul className="flex flex-col p-1.5">
                {reminders.map((reminder) => (
                  <li key={reminder.id}>
                    <Link
                      href={`/app/bills/${reminder.billId}`}
                      className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted"
                    >
                      <span className="mt-1.5">
                        <StatusDot tone="due" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{reminder.merchant}</span>
                          <span className="tabular text-sm text-muted-foreground">
                            {reminder.amount}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {reminder.due} · {reminder.when}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/app/settings">
                  <UserIcon />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/app/settings">
                  <Settings2Icon />
                  Reminders and data
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <form action={signOutAction}>
              <DropdownMenuItem asChild variant="destructive">
                <button type="submit" className="w-full">
                  <LogOutIcon />
                  Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
