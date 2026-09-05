"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { formatNumber } from "@/lib/format";
import {
  acquisitionChannels,
  acquisitionFunnel,
} from "@/lib/mock-data";

export function AcquisitionPage() {
  const [loading] = useState(false);
  const [channel, setChannel] = useState("all");
  const [step, setStep] = useState(0);
  const toast = useToast();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const funnelConversion =
    (
      (acquisitionFunnel[acquisitionFunnel.length - 1].value /
        acquisitionFunnel[0].value) *
      100
    ).toFixed(1);

  const filteredChannels =
    channel === "all"
      ? acquisitionChannels
      : acquisitionChannels.filter((c) => c.label === channel);

  const selectedStep =
    acquisitionFunnel[Math.min(step, acquisitionFunnel.length - 1)];
  const conversionToSelected =
    ((selectedStep.value / acquisitionFunnel[0].value) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Acquisition"
        description="Funil: Visitantes → Trial → Payment."
        actions={
          <Button size="sm" onClick={() => toast.show("Campanha criada (mock)")}>
            Nova campanha
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Leads", value: formatNumber(acquisitionFunnel[1].value) },
          { label: "Signups", value: formatNumber(acquisitionFunnel[2].value) },
          { label: "Trial → Paid", value: `${funnelConversion}%` },
          { label: "CAC", value: "R$ 42" },
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
        <h2 className="text-sm font-medium text-marka-graphite">Funil interativo</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {acquisitionFunnel.map((s, i) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setStep(i)}
              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                step === i
                  ? "border-marka-black bg-marka-black text-marka-white"
                  : "border-marka-graphite/20 bg-marka-white text-marka-graphite"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-md border border-marka-graphite/10 bg-marka-off/40 px-3 py-3">
          <p className="text-xs text-marka-gray">{selectedStep.label}</p>
          <p className="mt-1 text-lg font-semibold text-marka-black">
            {formatNumber(selectedStep.value)}
          </p>
          <p className="mt-1 text-xs text-marka-gray">
            Participação no funil: {conversionToSelected}%
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-marka-graphite">Canais</h2>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro canal"
          >
            <option value="all">Todos os canais</option>
            {acquisitionChannels.map((c) => (
              <option key={c.label} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {filteredChannels.length === 0 ? (
          <EmptyState
            title="Nenhum canal com esse filtro"
            description="Tente outro canal ou limpe o filtro."
          />
        ) : (
          <ul className="space-y-2">
            {filteredChannels.map((c) => (
              <li
                key={c.label}
                className="flex items-center justify-between gap-3 rounded-md border border-marka-graphite/10 px-3 py-2 text-sm"
              >
                <span>{c.label}</span>
                <span className="text-marka-graphite">{c.value}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
