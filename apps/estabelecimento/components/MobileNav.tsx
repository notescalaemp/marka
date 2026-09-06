"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, Users, Settings } from "lucide-react";
import { cn } from "@marka/ui/cn";
import { useStore } from "@/lib/store";
import { canAccess } from "@/lib/permissions";
import type { Role } from "@/lib/types";

export function MobileNav() {
  const pathname = usePathname();
  const { role } = useStore();

  const items = [
    {
      href: "/dashboard",
      label: "Home",
      icon: LayoutDashboard,
      permission: "dashboard" as const,
    },
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
      href: "/configuracoes",
      label: "Config",
      icon: Settings,
      permission: "settings" as const,
    },
  ];

  return (
    <nav className="glass-panel fixed bottom-0 left-0 right-0 z-40 border-t border-black/[0.06] px-2 py-2 lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          if (!canAccess(role as Role, item.permission)) return null;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors",
                active ? "text-marka-green-dark" : "text-marka-graphite/70"
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full transition-colors",
                  active ? "bg-marka-green-soft" : ""
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
