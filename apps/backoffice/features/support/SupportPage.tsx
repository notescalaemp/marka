"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/Toast";
import {
  createAdminSupportTicket,
  getAdminSupportTickets,
  updateAdminSupportTicket,
} from "@/lib/api";
import type {
  AdminSupportKpisDto,
  AdminSupportTicketDto,
} from "@/lib/api-types";
import { formatDateTime, formatNumber } from "@/lib/format";

const TYPE_FILTERS = ["all", "billing", "technical", "onboarding"] as const;
const STATUS_FILTERS = ["all", "open", "in_progress", "resolved"] as const;
const PRIORITY_FILTERS = ["all", "high", "medium", "low"] as const;
const STATUS_ACTIONS = ["open", "in_progress", "resolved"] as const;

export function SupportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<AdminSupportTicketDto[]>([]);
  const [kpis, setKpis] = useState<AdminSupportKpisDto | null>(null);
  const [type, setType] = useState<(typeof TYPE_FILTERS)[number]>("all");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [priority, setPriority] = useState<(typeof PRIORITY_FILTERS)[number]>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    customerName: "",
    type: "billing" as "billing" | "technical" | "onboarding",
    priority: "medium" as "high" | "medium" | "low",
    description: "",
  });
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminSupportTickets({
        search: q.trim() || undefined,
        type,
        status,
        priority,
      });
      setTickets(data.items);
      setKpis(data.kpis);
      setSelected((prev) =>
        prev && data.items.some((t) => t.id === prev)
          ? prev
          : (data.items[0]?.id ?? null)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar tickets");
      setTickets([]);
      setKpis(null);
    } finally {
      setLoading(false);
    }
  }, [q, type, status, priority]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selected) ?? null,
    [tickets, selected]
  );

  async function handleCreate() {
    if (!form.subject.trim() || !form.customerName.trim()) {
      toast.show("Preencha assunto e cliente");
      return;
    }
    setCreating(true);
    try {
      const ticket = await createAdminSupportTicket({
        subject: form.subject.trim(),
        customerName: form.customerName.trim(),
        type: form.type,
        priority: form.priority,
        description: form.description.trim() || undefined,
      });
      toast.show("Ticket criado");
      setShowCreate(false);
      setForm({
        subject: "",
        customerName: "",
        type: "billing",
        priority: "medium",
        description: "",
      });
      await load();
      setSelected(ticket.id);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Falha ao criar ticket");
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(next: (typeof STATUS_ACTIONS)[number]) {
    if (!selectedTicket) return;
    setSaving(true);
    try {
      const updated = await updateAdminSupportTicket(selectedTicket.id, {
        status: next,
      });
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.show("Status atualizado");
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Falha ao atualizar");
    } finally {
      setSaving(false);
    }
  }

  if (loading && tickets.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Support"
          description="Central de suporte interno para contas e incidentes."
        />
        <ErrorState description={error} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Central de suporte interno para contas e incidentes."
        actions={
          <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? "Cancelar" : "Novo ticket"}
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Abertos", value: formatNumber(kpis?.open ?? 0) },
          {
            label: "Alta prioridade",
            value: formatNumber(kpis?.highPriority ?? 0),
          },
          { label: "Resolvidos", value: formatNumber(kpis?.resolved ?? 0) },
          { label: "Em aberto", value: formatNumber(kpis?.openOnly ?? 0) },
        ].map((m) => (
          <div
            key={m.label}
            className="card p-3"
          >
            <p className="text-xs text-marka-gray">{m.label}</p>
            <p className="mt-1 text-lg font-semibold text-marka-black">
              {m.value}
            </p>
          </div>
        ))}
      </section>

      {showCreate ? (
        <div className="space-y-3 card p-4">
          <h2 className="text-sm font-medium text-marka-graphite">Novo ticket</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-marka-gray">Assunto</span>
              <input
                className="mt-1 field"
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
              />
            </label>
            <label className="block">
              <span className="text-xs text-marka-gray">Cliente</span>
              <input
                className="mt-1 field"
                value={form.customerName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerName: e.target.value }))
                }
              />
            </label>
            <label className="block">
              <span className="text-xs text-marka-gray">Tipo</span>
              <select
                className="mt-1 field"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as typeof form.type,
                  }))
                }
              >
                <option value="billing">billing</option>
                <option value="technical">technical</option>
                <option value="onboarding">onboarding</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-marka-gray">Prioridade</span>
              <select
                className="mt-1 field"
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    priority: e.target.value as typeof form.priority,
                  }))
                }
              >
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-marka-gray">Descrição</span>
            <textarea
              className="mt-1 field"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </label>
          <Button
            size="sm"
            disabled={creating}
            onClick={() => void handleCreate()}
          >
            {creating ? "Criando…" : "Criar ticket"}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-4">
          <div className="mb-4 flex flex-wrap gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar…"
              className="field-sm"
              aria-label="Buscar tickets"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="field-sm"
              aria-label="Filtro tipo"
            >
              {TYPE_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "Todos os tipos" : s}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="field-sm"
              aria-label="Filtro status"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "Todos os status" : s}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="field-sm"
              aria-label="Filtro prioridade"
            >
              {PRIORITY_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "Todas as prioridades" : s}
                </option>
              ))}
            </select>
          </div>

          {tickets.length === 0 ? (
            <EmptyState
              title="Nenhum ticket encontrado"
              description="Crie um ticket ou ajuste os filtros."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="table-head-row">
                    <th className="table-head-cell">Ticket</th>
                    <th className="table-head-cell">Cliente</th>
                    <th className="table-head-cell">Tipo</th>
                    <th className="table-head-cell">Status</th>
                    <th className="table-head-cell">Prioridade</th>
                    <th className="table-head-cell">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      className={`table-row ${
                        selected === t.id ? "bg-marka-off/60" : ""
                      }`}
                    >
                      <td className="table-cell">
                        <button
                          type="button"
                          className="font-medium text-marka-black underline"
                          onClick={() => setSelected(t.id)}
                        >
                          {t.subject}
                        </button>
                      </td>
                      <td className="table-cell">{t.customer}</td>
                      <td className="table-cell capitalize">{t.type}</td>
                      <td className="table-cell capitalize">
                        {t.status.replace("_", " ")}
                      </td>
                      <td className="table-cell capitalize">{t.priority}</td>
                      <td className="table-cell text-marka-gray">
                        {formatDateTime(t.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-4">
          {!selectedTicket ? (
            <EmptyState
              title="Selecione um ticket"
              description="Escolha um ticket na lista para ver o contexto e as ações."
            />
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-marka-graphite">Detalhe</h2>
              <div>
                <p className="text-xs text-marka-gray">Assunto</p>
                <p className="text-sm font-medium">{selectedTicket.subject}</p>
              </div>
              <div>
                <p className="text-xs text-marka-gray">Estabelecimento</p>
                <p className="text-sm">{selectedTicket.establishment}</p>
              </div>
              <div>
                <p className="text-xs text-marka-gray">Prioridade</p>
                <p className="text-sm capitalize">{selectedTicket.priority}</p>
              </div>
              <div>
                <p className="text-xs text-marka-gray">Status</p>
                <p className="text-sm capitalize">
                  {selectedTicket.status.replace("_", " ")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {STATUS_ACTIONS.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={
                      selectedTicket.status === s ? "primary" : "secondary"
                    }
                    disabled={saving || selectedTicket.status === s}
                    onClick={() => void handleStatusChange(s)}
                  >
                    {s.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
