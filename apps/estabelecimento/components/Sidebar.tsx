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
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-marka-graphite/10 bg-marka-black text-marka-white lg:flex">
      <div className="border-b border-marka-graphite/20 px-4 py-5">
        <MarkaMark className="text-marka-white" />
        <p className="mt-1 text-xs text-marka-gray">Estabelecimento</p>
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
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                        isActive(pathname, item.href)
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
    </aside>
  );
}
