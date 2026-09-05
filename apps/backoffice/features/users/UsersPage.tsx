"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { users } from "@/lib/mock-data";
import type { UserRow } from "@/lib/types";

const USER_TYPES = ["all", "Owner", "Admin", "Manager", "Professional", "Staff", "Customer"] as const;
const STATUS_FILTERS = ["all", "ativo", "inativo"] as const;

export function UsersPage() {
  const [loading] = useState(false);
  const [type, setType] = useState<(typeof USER_TYPES)[number]>("all");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (type !== "all" && u.type !== type) return false;
      if (status !== "all" && u.status !== status) return false;
      if (q.trim()) {
        const hay = `${u.name} ${u.establishment}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [type, status, q]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const active = users.filter((u) => u.status === "ativo").length;
  const dau = 128;
  const wau = 210;
  const mau = 240;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Gerenciar usuários da plataforma."
        actions={
          <Button size="sm" variant="secondary">
            Novo usuário
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total", value: String(users.length) },
          { label: "Ativos", value: String(active) },
          { label: "DAU", value: String(dau) },
          { label: "WAU", value: String(wau) },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-marka-graphite/10 bg-marka-white p-3"
          >
            <p className="text-xs text-marka-gray">{m.label}</p>
            <p className="mt-1 text-lg font-semibold text-marka-black">{m.value}</p>
          </div>
        ))}
      </section>

      <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Buscar usuários"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as (typeof USER_TYPES)[number])}
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro tipo"
          >
            {USER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "Todos os tipos" : t}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof STATUS_FILTERS)[number])}
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro status"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Todos os status" : s}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-marka-graphite/10 text-xs text-marka-gray">
                <th className="px-2 py-2 font-medium">Usuário</th>
                <th className="px-2 py-2 font-medium">Estabelecimento</th>
                <th className="px-2 py-2 font-medium">Tipo</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Último login</th>
                <th className="px-2 py-2 font-medium">Criaç.</th>
                <th className="px-2 py-2 font-medium">Atividade</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <UserRow key={u.id} user={u as UserRow} />
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? (
          <p className="mt-3 text-sm text-marka-gray">
            Nenhum usuário com esses filtros.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function UserRow({ user }: { user: UserRow }) {
  return (
    <tr className="border-b border-marka-graphite/5 hover:bg-marka-off/60">
      <td className="px-2 py-2 font-medium text-marka-black">{user.name}</td>
      <td className="px-2 py-2 text-marka-graphite">{user.establishment}</td>
      <td className="px-2 py-2">{user.type}</td>
      <td className="px-2 py-2">
        <span
          className={
            user.status === "ativo"
              ? "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-800"
              : "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-marka-off text-marka-graphite"
          }
        >
          {user.status}
        </span>
      </td>
      <td className="px-2 py-2 text-marka-gray">{user.lastLogin}</td>
      <td className="px-2 py-2 text-marka-gray">{user.createdAt}</td>
      <td className="px-2 py-2 text-marka-gray">{user.activity}</td>
    </tr>
  );
}
