"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { alerts } from "@/lib/mock-data";

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
  const [loading] = useState(false);
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]>("all");
  const toast = useToast();

  const filtered = useMemo(() => {
    if (severity === "all") return alerts;
    return alerts.filter((a) => a.severity === severity);
  }, [severity]);

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
