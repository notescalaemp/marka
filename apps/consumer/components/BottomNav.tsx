"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Heart,
  Home,
  Search,
  User,
} from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "Início", icon: Home },
  { href: "/buscar", label: "Buscar", icon: Search },
  { href: "/agendamentos", label: "Agendamentos", icon: Calendar },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-marka-graphite/10 bg-marka-white/95 backdrop-blur md:hidden"
      aria-label="Navegação principal"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-xs transition-colors",
                  active ? "text-marka-black" : "text-marka-gray"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
