"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/Toast";
import { getAmbassadorProgramSettings, updateAmbassadorProgramSettings } from "@/lib/api";
import type { AmbassadorProgramSettingsDto, CommissionModel, CommissionValueType } from "@/lib/types";

export function AmbassadorSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AmbassadorProgramSettingsDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setForm(await getAmbassadorProgramSettings());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      setForm(await updateAmbassadorProgramSettings(form));
      toast.show("Configurações salvas");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações do programa"
        description="Regras de comissão, saque e status do Indique e Ganhe — sem precisar de deploy."
        actions={
          <Button size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        }
      />

      <section className="card space-y-4 p-4">
        <label className="flex items-center gap-2 text-sm font-medium text-marka-black">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Programa ativo
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-marka-gray">Modelo de comissão</label>
            <select
              className="field-sm w-full"
              value={form.commissionModel}
              onChange={(e) => setForm({ ...form, commissionModel: e.target.value as CommissionModel })}
            >
              <option value="ONE_TIME">Única</option>
              <option value="RECURRING">Recorrente</option>
              <option value="HYBRID">Híbrida (bônus + recorrente)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-marka-gray">Tipo da comissão recorrente</label>
            <select
              className="field-sm w-full"
              value={form.commissionType}
              onChange={(e) => setForm({ ...form, commissionType: e.target.value as CommissionValueType })}
            >
              <option value="FIXED">Valor fixo</option>
              <option value="PERCENT">Percentual</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-marka-gray">Bônus inicial (R$)</label>
            <input
              type="number"
              className="field-sm w-full"
              value={form.bonusAmount ?? ""}
              onChange={(e) => setForm({ ...form, bonusAmount: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-marka-gray">Comissão recorrente (%)</label>
            <input
              type="number"
              className="field-sm w-full"
              value={form.recurringPercent ?? ""}
              onChange={(e) =>
                setForm({ ...form, recurringPercent: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-marka-gray">Comissão recorrente (R$)</label>
            <input
              type="number"
              className="field-sm w-full"
              value={form.recurringFixed ?? ""}
              onChange={(e) =>
                setForm({ ...form, recurringFixed: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-marka-gray">Saque mínimo (R$)</label>
            <input
              type="number"
              className="field-sm w-full"
              value={form.minWithdrawalAmount}
              onChange={(e) => setForm({ ...form, minWithdrawalAmount: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-marka-gray">Prazo de aprovação (dias)</label>
            <input
              type="number"
              className="field-sm w-full"
              value={form.approvalPeriodDays}
              onChange={(e) => setForm({ ...form, approvalPeriodDays: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-marka-gray">Regras de cancelamento</label>
          <textarea
            className="field-sm w-full"
            rows={4}
            value={form.cancellationRules ?? ""}
            onChange={(e) => setForm({ ...form, cancellationRules: e.target.value })}
          />
        </div>
      </section>
    </div>
  );
}
