"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { formatPrice } from "@/lib/format";
import { subscriptions } from "@/lib/mock-data";
import type { SubscriptionStatus } from "@/lib/types";

const STATUS_FILTERS = [
  "all",
  "active",
  "trial",
  "past_due",
  "canceled",
  "paused",
  "upgraded",
  "downgraded",
] as const;

export function SubscriptionsPage() {
  const [loading] = useState(false);
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [plan, setPlan] = useState("all");

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      if (status !== "all" && s.status !== status) return false;
      if (plan !== "all" && s.plan !== plan) return false;
      return true;
    });
  }, [status, plan]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const expansion = filtered.reduce((sum, s) => sum + s.mrr, 0);
  const contraction = filtered.reduce((sum, s) => sum + s.mrr * 0.1, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description="Gerenciar assinaturas e status."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Ativas", value: String(subscriptions.filter((s) => s.status === "active").length) },
          { label: "Trial", value: String(subscriptions.filter((s) => s.status === "trial").length) },
          { label: "Past due", value: String(subscriptions.filter((s) => s.status === "past_due").length) },
          { label: "Expansion MRR", value: formatPrice(expansion) },
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
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro plano"
          >
            <option value="all">Todos os planos</option>
            <option value="Pro">Pro</option>
            <option value="Starter">Starter</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-marka-graphite/10 text-xs text-marka-gray">
                <th className="px-2 py-2 font-medium">Cliente</th>
                <th className="px-2 py-2 font-medium">Estabelecimento</th>
                <th className="px-2 py-2 font-medium">Plano</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">MRR</th>
                <th className="px-2 py-2 font-medium">Entrada</th>
                <th className="px-2 py-2 font-medium">Próxima cobrança</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-marka-graphite/5 hover:bg-marka-off/60"
                >
                  <td className="px-2 py-2 font-medium">{s.customer}</td>
                  <td className="px-2 py-2 text-marka-graphite">{s.establishment}</td>
                  <td className="px-2 py-2">{s.plan}</td>
                  <td className="px-2 py-2 capitalize">{s.status}</td>
                  <td className="px-2 py-2">{formatPrice(s.mrr)}</td>
                  <td className="px-2 py-2 text-marka-gray">{s.createdAt}</td>
                  <td className="px-2 py-2 text-marka-gray">{s.nextBilling}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? (
          <p className="mt-3 text-sm text-marka-gray">
            Nenhuma assinatura com esses filtros.
          </p>
        ) : null}
      </div>
    </div>
  );
}
