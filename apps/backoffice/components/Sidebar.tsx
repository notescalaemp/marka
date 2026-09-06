"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ChartColumn,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  Users,
  Building2,
  Wallet,
  Shield,
  LineChart,
  UserRound,
  ClipboardList,
  Sparkles,
  Gift,
} from "lucide-react";
import { MarkaMark } from "./MarkaMark";
import { useStore } from "@/lib/store";
import { canAccess } from "@/lib/permissions";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/cn";

const groups = [
  {
    label: "Overview",
    items: [
      {
        href: "/overview",
        label: "Overview",
        icon: LayoutDashboard,
        permission: "overview" as const,
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        href: "/analytics/product-usage",
        label: "Overview",
        icon: ChartColumn,
        permission: "product_usage" as const,
      },
      {
        href: "/analytics/acquisition",
        label: "Acquisition",
        icon: Sparkles,
        permission: "acquisition" as const,
      },
      {
        href: "/analytics/retention",
        label: "Retention",
        icon: LineChart,
        permission: "retention" as const,
      },
      {
        href: "/analytics/churn",
        label: "Churn",
        icon: Users,
        permission: "churn" as const,
      },
      {
        href: "/analytics/churn-risk",
        label: "Churn Risk",
        icon: AlertTriangle,
        permission: "churn_risk" as const,
      },
    ],
  },
  {
    label: "Business",
    items: [
      {
        href: "/establishments",
        label: "Establishments",
        icon: Building2,
        permission: "establishments" as const,
      },
      {
        href: "/users",
        label: "Users",
        icon: Users,
        permission: "users" as const,
      },
      {
        href: "/customers",
        label: "Customers",
        icon: UserRound,
        permission: "customers" as const,
      },
    ],
  },
  {
    label: "Revenue",
    items: [
      {
        href: "/plans",
        label: "Plans",
        icon: Package,
        permission: "plans" as const,
      },
      {
        href: "/subscriptions",
        label: "Subscriptions",
        icon: ClipboardList,
        permission: "subscriptions" as const,
      },
      {
        href: "/payments",
        label: "Payments",
        icon: Wallet,
        permission: "payments" as const,
      },
      {
        href: "/finance",
        label: "Finance",
        icon: LineChart,
        permission: "finance" as const,
      },
    ],
  },
  {
    label: "Growth",
    items: [
      {
        href: "/ambassadors",
        label: "Indique e Ganhe",
        icon: Gift,
        permission: "ambassadors" as const,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        href: "/alerts",
        label: "Alerts",
        icon: AlertTriangle,
        permission: "alerts" as const,
      },
      {
        href: "/support",
        label: "Support",
        icon: MessageSquare,
        permission: "support" as const,
      },
      {
        href: "/audit-logs",
        label: "Audit Logs",
        icon: FileText,
        permission: "audit_logs" as const,
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        href: "/administrators",
        label: "Administrators",
        icon: Shield,
        permission: "administrators" as const,
      },
      {
        href: "/settings",
        label: "Settings",
        icon: Settings,
        permission: "settings" as const,
      },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (pathname.startsWith(`${href}/`)) return true;
  return false;
}

export function Sidebar() {
  const pathname = usePathname();
  const { role, logout } = useStore();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col glass-panel border-r border-black/[0.06] lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-black/[0.06] px-5">
        <MarkaMark className="text-marka-black" />
      </div>
      <nav className="stagger flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {groups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            canAccess(role as Role, item.permission)
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="mb-2 px-2.5 text-[10.5px] font-semibold uppercase tracking-widest text-marka-gray/80">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-200",
                          active
                            ? "bg-marka-green-soft text-marka-green-dark"
                            : "text-marka-graphite/80 hover:bg-marka-off hover:text-marka-black"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-marka-gradient transition-all duration-200",
                            active ? "opacity-100" : "opacity-0 group-hover:opacity-30"
                          )}
                        />
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            active ? "text-marka-green" : "text-marka-gray group-hover:text-marka-graphite"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-black/[0.06] p-3">
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-marka-graphite/70 transition-colors hover:bg-marka-off hover:text-marka-black"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  );
}
