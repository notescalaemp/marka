"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { formatPrice } from "@/lib/format";
import { plansDetailed } from "@/lib/mock-data";
import { useToast } from "@/components/Toast";

export function PlansPage() {
  const [loading] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [plans, setPlans] = useState(plansDetailed);
  const [compare, setCompare] = useState<string[]>(["Pro", "Starter"]);
  const toast = useToast();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totalSubs = plans.reduce((s, p) => s + p.subscribers, 0);
  const totalMrr = plans.reduce((s, p) => s + p.mrr, 0);
  const selectedPlans = useMemo(
    () => plans.filter((p) => compare.includes(p.name)),
    [plans, compare]
  );

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
            <Button
              size="sm"
              onClick={() => toast.show("Plans salvos")}
            >
              Salvar
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
            className="rounded-lg border border-marka-graphite/10 bg-marka-white p-3"
          >
            <p className="text-xs text-marka-gray">{m.label}</p>
            <p className="mt-1 text-lg font-semibold text-marka-black">{m.value}</p>
          </div>
        ))}
      </section>

      <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
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
                  ? "border-marka-black bg-marka-black text-marka-white"
                  : "border-marka-graphite/20 bg-marka-white text-marka-graphite"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-marka-graphite/10 text-xs text-marka-gray">
                <th className="px-2 py-2 font-medium">Plano</th>
                <th className="px-2 py-2 font-medium">Assinantes</th>
                <th className="px-2 py-2 font-medium">Ativos</th>
                <th className="px-2 py-2 font-medium">Trial</th>
                <th className="px-2 py-2 font-medium">MRR</th>
                <th className="px-2 py-2 font-medium">% MRR</th>
                <th className="px-2 py-2 font-medium">ARPU</th>
                <th className="px-2 py-2 font-medium">Churn</th>
                <th className="px-2 py-2 font-medium">Upgrade</th>
                <th className="px-2 py-2 font-medium">Downgrade</th>
                <th className="px-2 py-2 font-medium">Trial → Paid</th>
                <th className="px-2 py-2 font-medium">LTV</th>
                <th className="px-2 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-marka-graphite/5 hover:bg-marka-off/60"
                >
                  <td className="px-2 py-2 font-medium">{p.name}</td>
                  <td className="px-2 py-2">{p.subscribers}</td>
                  <td className="px-2 py-2">{p.active}</td>
                  <td className="px-2 py-2">{p.trial}</td>
                  <td className="px-2 py-2">{formatPrice(p.mrr)}</td>
                  <td className="px-2 py-2">{p.revenueShare}%</td>
                  <td className="px-2 py-2">{formatPrice(p.arpu)}</td>
                  <td className="px-2 py-2">{p.churn.toFixed(1)}%</td>
                  <td className="px-2 py-2">{p.upgradeRate.toFixed(1)}%</td>
                  <td className="px-2 py-2">{p.downgradeRate.toFixed(1)}%</td>
                  <td className="px-2 py-2">{p.trialToPaid.toFixed(1)}%</td>
                  <td className="px-2 py-2">{formatPrice(p.ltv)}</td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs text-emerald-700 underline"
                        onClick={() => setEditing(p.id)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="text-xs text-marka-graphite underline"
                        onClick={() => toast.show("Plano ativado")}
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
        <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
          <h2 className="text-sm font-medium text-marka-graphite">Novo plano</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Nome"
              className="rounded-md border border-marka-graphite/20 px-2 py-1.5 text-xs"
              aria-label="Nome do plano"
            />
            <input
              placeholder="Preço"
              className="rounded-md border border-marka-graphite/20 px-2 py-1.5 text-xs"
              aria-label="Preço do plano"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button size="sm" variant="secondary" onClick={() => {
              setShowCreate(false);
              toast.show("Plano criado");
            }}>
              Salvar
            </Button>
          </div>
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
          <p className="text-sm text-marka-black">
            Confirmar desativação deste plano? Isso afeta assinantes ativos.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setConfirmDelete(null);
                toast.show("Plano desativado");
              }}
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
        <div className="rounded-lg border border-marka-graphite/10 bg-marka-white p-4">
          <h2 className="text-sm font-medium text-marka-graphite">Editar plano</h2>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => setEditing(null)}>
              Fechar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
