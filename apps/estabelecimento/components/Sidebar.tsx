"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChartColumn,
  LayoutDashboard,
  Users,
  UserRound,
  Scissors,
  MessageSquare,
  Sparkles,
  Settings,
  Package,
  ShoppingBag,
  FileBarChart,
  Megaphone,
} from "lucide-react";
import { cn } from "@marka/ui/cn";
import { MarkaMark } from "./MarkaMark";
import { useStore } from "@/lib/store";
import { canAccess } from "@/lib/permissions";
import type { Role } from "@/lib/types";

const groups = [
  {
    label: "Visão geral",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        permission: "dashboard" as const,
      },
    ],
  },
  {
    label: "Operação",
    items: [
      {
        href: "/agenda",
        label: "Agenda",
        icon: CalendarDays,
        permission: "agenda" as const,
      },
      {
        href: "/clientes",
        label: "Clientes",
        icon: Users,
        permission: "clients" as const,
      },
      {
        href: "/profissionais",
        label: "Profissionais",
        icon: UserRound,
        permission: "professionals" as const,
      },
      {
        href: "/servicos",
        label: "Serviços",
        icon: Scissors,
        permission: "services" as const,
      },
    ],
  },
  {
    label: "Relacionamento",
    items: [
      {
        href: "/crm",
        label: "CRM",
        icon: MessageSquare,
        permission: "crm" as const,
      },
      {
        href: "/marketing",
        label: "Marketing",
        icon: Megaphone,
        permission: "marketing" as const,
      },
    ],
  },
  {
    label: "Gestão",
    items: [
      {
        href: "/financeiro",
        label: "Financeiro",
        icon: ChartColumn,
        permission: "finance" as const,
      },
      {
        href: "/produtos",
        label: "Produtos",
        icon: Package,
        permission: "products" as const,
      },
      {
        href: "/estoque",
        label: "Estoque",
        icon: ShoppingBag,
        permission: "stock" as const,
      },
      {
        href: "/relatorios",
        label: "Relatórios",
        icon: FileBarChart,
        permission: "reports" as const,
      },
    ],
  },
  {
    label: "Inteligência",
    items: [
      {
        href: "/marka-ai",
        label: "marka AI",
        icon: Sparkles,
        permission: "ai" as const,
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        href: "/configuracoes",
        label: "Configurações",
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
    </aside>
  );
}
