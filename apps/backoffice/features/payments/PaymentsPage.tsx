"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { formatPrice } from "@/lib/format";
import { payments } from "@/lib/mock-data";

const STATUS_FILTERS = [
  "all",
  "approved",
  "pending",
  "failed",
  "refunded",
] as const;

const METHODS = ["all", "PIX", "card", "boleto"] as const;

export function PaymentsPage() {
  const [loading] = useState(false);
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("all");

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (method !== "all" && p.method !== method) return false;
      return true;
    });
  }, [status, method]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const approved = payments.filter((p) => p.status === "approved").length;
  const volume = payments.reduce((s, p) => s + p.value, 0);
  const failureRate =
    payments.filter((p) => p.status === "failed").length / Math.max(payments.length, 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Pagamentos e métodos (PIX, cartão, boleto)."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Volume", value: formatPrice(volume) },
          { label: "Aprovados", value: String(approved) },
          { label: "Falhas", value: String(payments.filter((p) => p.status === "failed").length) },
          { label: "Failure rate", value: `${(failureRate * 100).toFixed(0)}%` },
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
            value={method}
            onChange={(e) => setMethod(e.target.value as (typeof METHODS)[number])}
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro método"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m === "all" ? "Todos os métodos" : m}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-marka-graphite/10 text-xs text-marka-gray">
                <th className="px-2 py-2 font-medium">Pagamento</th>
                <th className="px-2 py-2 font-medium">Cliente</th>
                <th className="px-2 py-2 font-medium">Estabelecimento</th>
                <th className="px-2 py-2 font-medium">Valor</th>
                <th className="px-2 py-2 font-medium">Método</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-marka-graphite/5 hover:bg-marka-off/60"
                >
                  <td className="px-2 py-2 font-medium">{p.id}</td>
                  <td className="px-2 py-2">{p.customer}</td>
                  <td className="px-2 py-2 text-marka-graphite">{p.establishment}</td>
                  <td className="px-2 py-2">{formatPrice(p.value)}</td>
                  <td className="px-2 py-2">{p.method}</td>
                  <td className="px-2 py-2 capitalize">{p.status}</td>
                  <td className="px-2 py-2 text-marka-gray">{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
