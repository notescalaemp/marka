"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/Toast";
import { getAdminAlerts } from "@/lib/api";
import type { AdminAlertDto } from "@/lib/api-types";

const SEVERITIES = [
  "all",
  "critical",
  "warning",
  "opportunity",
  "info",
] as const;

const TONE: Record<string, string> = {
  critical: "bg-red-50 text-red-800",
  warning: "bg-amber-50 text-amber-800",
  opportunity: "bg-emerald-50 text-emerald-800",
  info: "bg-sky-50 text-sky-800",
};

export function AlertsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AdminAlertDto[]>([]);
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>("all");
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminAlerts();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar alertas");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (severity === "all") return alerts;
    return alerts.filter((a) => a.severity === severity);
  }, [alerts, severity]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Alerts" description="Central de alertas da marka.ia." />
        <ErrorState description={error} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Central de alertas da marka.ia."
      />

      <div className="flex flex-wrap gap-2">
        {SEVERITIES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeverity(s)}
            className={`rounded-md border px-2.5 py-1 text-xs capitalize transition-colors ${
              severity === s
                ? "border-marka-black bg-marka-black text-marka-white"
                : "border-marka-graphite/20 bg-marka-white text-marka-graphite"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum alerta com esse filtro"
          description="Mude a categoria ou limpe o filtro."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium uppercase ${TONE[a.severity]}`}
                >
                  {a.severity}
                </span>
                <h2 className="text-sm font-medium text-marka-black">{a.title}</h2>
              </div>
              <p className="mt-2 text-sm text-marka-gray">{a.description}</p>
              {a.cta ? (
                <button
                  type="button"
                  className="mt-3 text-xs font-medium text-emerald-700 underline"
                  onClick={() => toast.show(`CTA: ${a.cta}`)}
                >
                  {a.cta}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
