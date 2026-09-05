"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/Toast";
import { getAdminSettings, updateAdminSettings } from "@/lib/api";
import type { AdminSettingsDto } from "@/lib/api-types";

const SECTIONS = ["General", "Feature Flags", "System"] as const;
type Section = (typeof SECTIONS)[number];

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AdminSettingsDto | null>(null);
  const [section, setSection] = useState<Section>("General");
  const [brandName, setBrandName] = useState("");
  const [locale, setLocale] = useState("pt-BR");
  const [features, setFeatures] = useState<AdminSettingsDto["features"] | null>(
    null
  );
  const [marketingSpendMonthly, setMarketingSpendMonthly] = useState(0);
  const [paymentFeePercent, setPaymentFeePercent] = useState(0);
  const [note, setNote] = useState("");
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dto = await getAdminSettings();
      setSettings(dto);
      setBrandName(dto.brand.name);
      setLocale(dto.brand.locale);
      setFeatures({ ...dto.features });
      setMarketingSpendMonthly(dto.marketingSpendMonthly);
      setPaymentFeePercent(dto.paymentFeePercent);
      setNote(dto.note);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar settings");
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    if (!features) return;
    setSaving(true);
    try {
      const updated = await updateAdminSettings({
        brandName,
        locale,
        features,
        marketingSpendMonthly,
        paymentFeePercent,
        note,
      });
      setSettings(updated);
      setBrandName(updated.brand.name);
      setLocale(updated.brand.locale);
      setFeatures({ ...updated.features });
      setMarketingSpendMonthly(updated.marketingSpendMonthly);
      setPaymentFeePercent(updated.paymentFeePercent);
      setNote(updated.note);
      toast.show("Settings salvos");
    } catch (err) {
      toast.show(
        err instanceof Error ? err.message : "Falha ao salvar settings"
      );
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (!settings) return;
    setBrandName(settings.brand.name);
    setLocale(settings.brand.locale);
    setFeatures({ ...settings.features });
    setMarketingSpendMonthly(settings.marketingSpendMonthly);
    setPaymentFeePercent(settings.paymentFeePercent);
    setNote(settings.note);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !settings || !features) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Configurações internas do SaaS."
        />
        <ErrorState
          description={error ?? "Settings indisponíveis"}
          onRetry={() => void load()}
        />
      </div>
    );
  }

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
            {section === "General" ? (
              <>
                <label className="block">
                  <span className="text-xs text-marka-gray">Nome da marca</span>
                  <input
                    className="mt-1 w-full rounded-md border border-marka-graphite/20 px-2 py-1.5 text-sm"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-marka-gray">Locale padrão</span>
                  <select
                    className="mt-1 w-full rounded-md border border-marka-graphite/20 px-2 py-1.5 text-sm"
                    value={locale}
                    onChange={(e) => setLocale(e.target.value)}
                  >
                    <option value="pt-BR">pt-BR</option>
                    <option value="en-US">en-US</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-marka-gray">Ambiente</span>
                  <input
                    className="mt-1 w-full rounded-md border border-marka-graphite/20 bg-marka-off/40 px-2 py-1.5 text-sm"
                    value={settings.environment}
                    readOnly
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-marka-gray">
                    Spend de marketing mensal (CAC)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="mt-1 w-full rounded-md border border-marka-graphite/20 px-2 py-1.5 text-sm"
                    value={marketingSpendMonthly}
                    onChange={(e) =>
                      setMarketingSpendMonthly(Number(e.target.value) || 0)
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-marka-gray">
                    Taxa de pagamento (%)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    className="mt-1 w-full rounded-md border border-marka-graphite/20 px-2 py-1.5 text-sm"
                    value={paymentFeePercent}
                    onChange={(e) =>
                      setPaymentFeePercent(Number(e.target.value) || 0)
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-marka-gray">Nota interna</span>
                  <textarea
                    className="mt-1 w-full rounded-md border border-marka-graphite/20 px-2 py-1.5 text-sm"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
              </>
            ) : null}

            {section === "Feature Flags"
              ? Object.entries(features).map(([key, enabled]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between gap-3 rounded-md border border-marka-graphite/10 px-3 py-2"
                  >
                    <span className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, " $1")}
                    </span>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) =>
                        setFeatures((prev) =>
                          prev ? { ...prev, [key]: e.target.checked } : prev
                        )
                      }
                    />
                  </label>
                ))
              : null}

            {section === "System" ? (
              <>
                <label className="block">
                  <span className="text-xs text-marka-gray">API URL</span>
                  <input
                    className="mt-1 w-full rounded-md border border-marka-graphite/20 bg-marka-off/40 px-2 py-1.5 text-sm"
                    value={settings.apiUrl || "—"}
                    readOnly
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-marka-gray">Cookie domain</span>
                  <input
                    className="mt-1 w-full rounded-md border border-marka-graphite/20 bg-marka-off/40 px-2 py-1.5 text-sm"
                    value={settings.cookieDomain || "—"}
                    readOnly
                  />
                </label>
              </>
            ) : null}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? "Salvando…" : "Salvar"}
            </Button>
            <Button size="sm" variant="secondary" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
