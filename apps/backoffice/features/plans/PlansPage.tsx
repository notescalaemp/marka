"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/Skeleton";
import { formatPrice } from "@/lib/format";
import {
  createAdminPlan,
  getAdminPlans,
  patchAdminPlan,
} from "@/lib/api";
import type { AdminPlanListItemDto } from "@/lib/api-types";
import { useToast } from "@/components/Toast";

export function PlansPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<AdminPlanListItemDto[]>([]);
  const [editing, setEditing] = useState<AdminPlanListItemDto | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createCode, setCreateCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [compare, setCompare] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminPlans();
      setPlans(data);
      if (data.length > 0) {
        setCompare((prev) => (prev.length === 0 ? data.slice(0, 2).map((p) => p.name) : prev));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar planos");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalSubs = plans.reduce((s, p) => s + p.subscribers, 0);
  const totalMrr = plans.reduce((s, p) => s + p.mrr, 0);
  const selectedPlans = useMemo(
    () => plans.filter((p) => compare.includes(p.name)),
    [plans, compare]
  );

  async function handleCreate() {
    const price = parseFloat(createPrice.replace(",", "."));
    if (!createCode.trim() || !createName.trim() || Number.isNaN(price)) {
      toast.show("Preencha código, nome e preço válidos");
      return;
    }
    setSaving(true);
    try {
      await createAdminPlan({
        code: createCode.trim(),
        name: createName.trim(),
        priceMonthly: price,
      });
      setShowCreate(false);
      setCreateCode("");
      setCreateName("");
      setCreatePrice("");
      toast.show("Plano criado");
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Erro ao criar plano");
    } finally {
      setSaving(false);
    }
  }

  async function handlePatch(id: string, data: { name?: string; priceMonthly?: number; active?: boolean }) {
    setSaving(true);
    try {
      await patchAdminPlan(id, data);
      toast.show("Plano atualizado");
      setEditing(null);
      setConfirmDelete(null);
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Erro ao atualizar plano");
    } finally {
      setSaving(false);
    }
  }

  if (loading && plans.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error && plans.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Plans" description="Administrar planos da marka.ia." />
        <ErrorState description={error} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans"
        description="Administrar planos da marka.ia."
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => setShowCreate(true)}>
              Criar plano
            </Button>
            <Button size="sm" onClick={() => void load()}>
              Atualizar
            </Button>
          </>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Planos", value: String(plans.length) },
          { label: "Assinantes", value: String(totalSubs) },
          { label: "MRR total", value: formatPrice(totalMrr) },
          { label: "Comparando", value: String(selectedPlans.length) },
        ].map((m) => (
          <div
            key={m.label}
            className="card p-3"
          >
            <p className="text-xs text-marka-gray">{m.label}</p>
            <p className="mt-1 text-lg font-semibold text-marka-black">{m.value}</p>
          </div>
        ))}
      </section>

      <div className="card p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setCompare((prev) => {
                  if (prev.includes(p.name)) {
                    return prev.filter((n) => n !== p.name);
                  }
                  return [...prev, p.name];
                });
              }}
              className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                compare.includes(p.name)
                  ? "border-transparent bg-marka-gradient text-white shadow-card-hover"
                  : "border-black/10 bg-white text-marka-graphite hover:border-marka-green/40 hover:text-marka-green"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="table-head-row">
                <th className="table-head-cell">Plano</th>
                <th className="table-head-cell">Assinantes</th>
                <th className="table-head-cell">Ativos</th>
                <th className="table-head-cell">Trial</th>
                <th className="table-head-cell">MRR</th>
                <th className="table-head-cell">% MRR</th>
                <th className="table-head-cell">ARPU</th>
                <th className="table-head-cell">Churn</th>
                <th className="table-head-cell">Upgrade</th>
                <th className="table-head-cell">Downgrade</th>
                <th className="table-head-cell">Trial → Paid</th>
                <th className="table-head-cell">LTV</th>
                <th className="table-head-cell">Ações</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr
                  key={p.id}
                  className="table-row"
                >
                  <td className="table-cell font-medium text-marka-black">{p.name}</td>
                  <td className="table-cell">{p.subscribers}</td>
                  <td className="table-cell">{p.activeCount}</td>
                  <td className="table-cell">{p.trialCount}</td>
                  <td className="table-cell">{formatPrice(p.mrr)}</td>
                  <td className="table-cell">{p.revenueShare.toFixed(1)}%</td>
                  <td className="table-cell">{formatPrice(p.arpu)}</td>
                  <td className="table-cell">{p.churn.toFixed(1)}%</td>
                  <td className="table-cell">{p.upgradeRate.toFixed(1)}%</td>
                  <td className="table-cell">{p.downgradeRate.toFixed(1)}%</td>
                  <td className="table-cell">{p.trialToPaid.toFixed(1)}%</td>
                  <td className="table-cell">
                    {p.ltv == null ? "—" : formatPrice(p.ltv)}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs text-marka-green-dark underline"
                        onClick={() => {
                          setEditing(p);
                          setEditName(p.name);
                          setEditPrice(String(p.priceMonthly));
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="text-xs text-marka-graphite underline"
                        disabled={saving || p.active}
                        onClick={() => void handlePatch(p.id, { active: true })}
                      >
                        Ativar
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-700 underline"
                        onClick={() => setConfirmDelete(p.id)}
                      >
                        Desativar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate ? (
        <div className="card p-4">
          <h2 className="text-sm font-medium text-marka-graphite">Novo plano</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <input
              placeholder="Código"
              value={createCode}
              onChange={(e) => setCreateCode(e.target.value)}
              className="field-sm"
              aria-label="Código do plano"
            />
            <input
              placeholder="Nome"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="field-sm"
              aria-label="Nome do plano"
            />
            <input
              placeholder="Preço mensal"
              value={createPrice}
              onChange={(e) => setCreatePrice(e.target.value)}
              className="field-sm"
              aria-label="Preço do plano"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={saving}
              onClick={() => void handleCreate()}
            >
              Salvar
            </Button>
          </div>
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="card p-4">
          <p className="text-sm text-marka-black">
            Confirmar desativação deste plano? Isso afeta assinantes ativos.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={saving}
              onClick={() => void handlePatch(confirmDelete, { active: false })}
            >
              Confirmar
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="card p-4">
          <h2 className="text-sm font-medium text-marka-graphite">Editar plano</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="field-sm"
              aria-label="Nome"
            />
            <input
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="field-sm"
              aria-label="Preço"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => setEditing(null)}>
              Fechar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={saving}
              onClick={() => {
                const price = parseFloat(editPrice.replace(",", "."));
                if (!editName.trim() || Number.isNaN(price)) {
                  toast.show("Nome e preço válidos são obrigatórios");
                  return;
                }
                void handlePatch(editing.id, {
                  name: editName.trim(),
                  priceMonthly: price,
                });
              }}
            >
              Salvar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
