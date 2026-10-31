"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  LayoutDashboard,
  Repeat2,
  ReceiptText,
  Settings2,
  Sparkles,
} from "lucide-react";
import { cn } from "cn";
import { Logo } from "@/components/brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function AppSidebar({
  overdueCount,
  pendingCount,
  subscriptionCount,
  address,
  mode,
}: {
  overdueCount: number;
  pendingCount: number;
  subscriptionCount: number;
  address: string;
  mode: "demo" | "live";
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  const nav: NavItem[] = [
    { href: "/app", label: "Overview", icon: LayoutDashboard },
    { href: "/app/bills", label: "Bills", icon: ReceiptText, badge: pendingCount },
    { href: "/app/subscriptions", label: "Subscriptions", icon: Repeat2, badge: subscriptionCount },
    { href: "/app/inbox", label: "Inbox", icon: Inbox },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <Link href="/app" className="flex items-center gap-2 px-1 text-sidebar-foreground">
          <Logo wordmarkClassName="group-data-[collapsible=icon]:hidden" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.label}
                    className={cn(
                      "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon
                        className={cn(isActive(item.href) && "text-sidebar-primary")}
                      />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge ? (
                    <SidebarMenuBadge className="bg-sidebar-primary/15 text-sidebar-primary">
                      {item.badge}
                    </SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/app/settings")}
                  tooltip="Settings"
                  className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                >
                  <Link href="/app/settings">
                    <Settings2
                      className={cn(isActive("/app/settings") && "text-sidebar-primary")}
                    />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 px-3 pb-4">
        <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/60 p-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-sidebar-foreground/60">
              Your forwarding address
            </span>
            <Badge
              variant="outline"
              className={cn(
                "h-5 border-transparent px-1.5 text-[10px]",
                overdueCount > 0
                  ? "bg-sidebar-primary/15 text-sidebar-primary"
                  : "bg-sidebar-accent text-sidebar-foreground/60",
              )}
            >
              {mode === "demo" ? "Demo" : "Live"}
            </Badge>
          </div>
          <p className="mt-1.5 truncate font-mono text-[11px] text-sidebar-foreground/85">
            {address}
          </p>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-sidebar-foreground/55">
              <span className="size-1.5 rounded-full bg-sidebar-primary" />
              {overdueCount > 0 ? `${overdueCount} overdue` : "All clear"}
            </span>
            <CopyButton
              value={address}
              label="Copy"
              className="h-6 border-sidebar-border/70 bg-transparent px-2 text-[11px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            />
          </div>
        </div>

        <Link
          href="/app/inbox"
          className="flex items-center gap-2 rounded-lg px-1 py-1 text-[11px] text-sidebar-foreground/55 transition-colors hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
        >
          <Sparkles className="size-3.5" />
          Forward a bill to test extraction
        </Link>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
