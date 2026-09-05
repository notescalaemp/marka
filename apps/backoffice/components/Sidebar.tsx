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
  UserCheck,
  UserRound,
  ClipboardList,
  Sparkles,
  ArrowLeftRight,
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
  const { role } = useStore();

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-marka-graphite/10 bg-marka-black text-marka-white lg:flex">
      <div className="border-b border-marka-graphite/20 px-4 py-5">
        <MarkaMark className="text-marka-white" />
        <p className="mt-1 text-xs text-marka-gray">Backoffice</p>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wide text-marka-gray">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const allowed = canAccess(role as Role, item.permission);
                if (!allowed) return null;
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                        active
                          ? "bg-marka-graphite text-marka-white"
                          : "text-marka-gray hover:bg-marka-graphite/50 hover:text-marka-white"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-marka-graphite/20 px-3 py-3">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-marka-gray hover:bg-marka-graphite/50 hover:text-marka-white"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  );
}
