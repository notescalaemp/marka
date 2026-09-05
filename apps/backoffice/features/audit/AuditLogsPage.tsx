"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { auditLogs } from "@/lib/mock-data";

const RESULT_FILTERS = ["all", "sucesso", "falha"] as const;
const ACTION_FILTERS = ["all", "login", "alteração de plano", "bloqueio"] as const;

export function AuditLogsPage() {
  const [loading] = useState(false);
  const [result, setResult] = useState<(typeof RESULT_FILTERS)[number]>("all");
  const [action, setAction] = useState<(typeof ACTION_FILTERS)[number]>("all");
  const [admin, setAdmin] = useState("all");

  const admins = useMemo(() => {
    const set = new Set(auditLogs.map((l) => l.admin));
    return ["all", ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    return auditLogs.filter((l) => {
      if (result !== "all" && result === "sucesso" && l.result !== "sucesso") return false;
      if (result === "falha" && l.result === "sucesso") return false;
      if (action !== "all" && l.action !== action) return false;
      if (admin !== "all" && l.admin !== admin) return false;
      return true;
    });
  }, [result, action, admin]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Registro de ações administrativas."
      />

      <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={result}
            onChange={(e) => setResult(e.target.value as (typeof RESULT_FILTERS)[number])}
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro resultado"
          >
            {RESULT_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Todos os resultados" : s}
              </option>
            ))}
          </select>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as (typeof ACTION_FILTERS)[number])}
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro ação"
          >
            {ACTION_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Todas as ações" : s}
              </option>
            ))}
          </select>
          <select
            value={admin}
            onChange={(e) => setAdmin(e.target.value)}
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro administrador"
          >
            {admins.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "Todos os admins" : s}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="Nenhum log com esses filtros"
            description="Ajuste os filtros ou limpe a busca."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-marka-graphite/10 text-xs text-marka-gray">
                  <th className="px-2 py-2 font-medium">Data/hora</th>
                  <th className="px-2 py-2 font-medium">Administrador</th>
                  <th className="px-2 py-2 font-medium">Ação</th>
                  <th className="px-2 py-2 font-medium">Entidade</th>
                  <th className="px-2 py-2 font-medium">Resultado</th>
                  <th className="px-2 py-2 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-marka-graphite/5 hover:bg-marka-off/60"
                  >
                    <td className="px-2 py-2 text-marka-gray">{l.at}</td>
                    <td className="px-2 py-2">{l.admin}</td>
                    <td className="px-2 py-2">{l.action}</td>
                    <td className="px-2 py-2">{l.entity}</td>
                    <td className="px-2 py-2 capitalize">{l.result}</td>
                    <td className="px-2 py-2 text-marka-gray">{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
