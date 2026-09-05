"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";

const SECTIONS = [
  "General",
  "Billing",
  "Plans",
  "Notifications",
  "Security",
  "Integrations",
  "Feature Flags",
  "System",
] as const;

const SECTION_FIELDS: Record<(typeof SECTIONS)[number], { label: string; type: "text" | "select" | "toggle"; options?: string[]; default?: string }[]> = {
  General: [
    { label: "Nome da marca", type: "text", default: "marka.ia" },
    { label: "Domínio", type: "text", default: "marka.ia" },
    { label: "Locale padrão", type: "select", options: ["pt-BR", "en-US"], default: "pt-BR" },
  ],
  Billing: [
    { label: "Gateway de pagamento", type: "select", options: ["Stripe", "PagSeguro", "PayPal"], default: "Stripe" },
    { label: "Taxa de sucesso", type: "text", default: "0.5%" },
  ],
  Plans: [
    { label: "Máximo de planos ativos", type: "text", default: "10" },
  ],
  Notifications: [
    { label: "E-mail de alertas", type: "text", default: "ops@marka.ia" },
    { label: "Webhook de falhas", type: "text", default: "https://" },
  ],
  Security: [
    { label: "2FA obrigatório", type: "toggle", default: "true" },
    { label: "Token de sessão (min)", type: "text", default: "60" },
  ],
  Integrations: [
    { label: "Slack", type: "toggle", default: "false" },
    { label: "HubSpot", type: "toggle", default: "false" },
  ],
  "Feature Flags": [
    { label: "marka AI", type: "toggle", default: "true" },
    { label: "CRM v2", type: "toggle", default: "false" },
  ],
  System: [
    { label: "Data retention (dias)", type: "text", default: "90" },
  ],
};

export function SettingsPage() {
  const [loading] = useState(false);
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("General");
  const [values, setValues] = useState<Record<string, Record<string, string>>>(
    Object.fromEntries(
      SECTIONS.map((s) => [
        s,
        Object.fromEntries(
          (SECTION_FIELDS[s] ?? []).map((f) => [f.label, f.default ?? ""])
        ),
      ])
    )
  );
  const toast = useToast();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const fields = SECTION_FIELDS[section];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configurações internas do SaaS."
      />

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-lg border border-marka-graphite/10 bg-marka-white p-2">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSection(s)}
              className={`mb-1 w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                section === s
                  ? "bg-marka-black text-marka-white"
                  : "text-marka-graphite hover:bg-marka-off"
              }`}
            >
              {s}
            </button>
          ))}
        </aside>

        <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
          <h2 className="text-sm font-medium text-marka-graphite">{section}</h2>

          <div className="mt-4 space-y-4">
            {fields.map((field) => {
              const value = values[section]?.[field.label] ?? "";
              if (field.type === "toggle") {
                return (
                  <label
                    key={field.label}
                    className="flex items-center justify-between gap-3 rounded-md border border-marka-graphite/10 px-3 py-2"
                  >
                    <span className="text-sm">{field.label}</span>
                    <input
                      type="checkbox"
                      checked={value === "true"}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [section]: {
                            ...prev[section],
                            [field.label]: e.target.checked ? "true" : "false",
                          },
                        }))
                      }
                    />
                  </label>
                );
              }
              if (field.type === "select") {
                return (
                  <label key={field.label} className="block">
                    <span className="text-xs text-marka-gray">{field.label}</span>
                    <select
                      className="mt-1 w-full rounded-md border border-marka-graphite/20 px-2 py-1.5 text-sm"
                      value={value}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [section]: {
                            ...prev[section],
                            [field.label]: e.target.value,
                          },
                        }))
                      }
                    >
                      {(field.options ?? []).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              }
              return (
                <label key={field.label} className="block">
                  <span className="text-xs text-marka-gray">{field.label}</span>
                  <input
                    className="mt-1 w-full rounded-md border border-marka-graphite/20 px-2 py-1.5 text-sm"
                    value={value}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [section]: {
                          ...prev[section],
                          [field.label]: e.target.value,
                        },
                      }))
                    }
                  />
                </label>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              onClick={() => toast.show(`${section} salvo`)}
            >
              Salvar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setValues((prev) => ({
                  ...prev,
                  [section]: Object.fromEntries(
                    (SECTION_FIELDS[section] ?? []).map((f) => [
                      f.label,
                      f.default ?? "",
                    ])
                  ),
                }))
              }
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
