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
      });
      setSettings(updated);
      setBrandName(updated.brand.name);
      setLocale(updated.brand.locale);
      setFeatures({ ...updated.features });
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
        <aside className="card p-2">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSection(s)}
              className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${
                section === s
                  ? "bg-marka-green-soft text-marka-green-dark"
                  : "text-marka-graphite hover:bg-marka-off"
              }`}
            >
              {s}
            </button>
          ))}
        </aside>

        <div className="card p-4">
          <h2 className="text-sm font-medium text-marka-graphite">{section}</h2>

          <div className="mt-4 space-y-4">
            {section === "General" ? (
              <>
                <label className="block">
                  <span className="text-xs text-marka-gray">Nome da marca</span>
                  <input
                    className="mt-1 field"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-marka-gray">Locale padrão</span>
                  <select
                    className="mt-1 field"
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
                    className="mt-1 field bg-marka-off/60"
                    value={settings.environment}
                    readOnly
                  />
                </label>
              </>
            ) : null}

            {section === "Feature Flags"
              ? Object.entries(features).map(([key, enabled]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] px-3 py-2"
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
                    className="mt-1 field bg-marka-off/60"
                    value={settings.apiUrl ?? "—"}
                    readOnly
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-marka-gray">Cookie domain</span>
                  <input
                    className="mt-1 field bg-marka-off/60"
                    value={settings.cookieDomain ?? "—"}
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
