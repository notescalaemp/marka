"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@marka/ui/button";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { EmptyState } from "@/components/EmptyState";
import { useStore } from "@/lib/store";
import { StatusBadge } from "@marka/ui/badge-status";
import { formatDateTime } from "@/lib/format";
import type { AppointmentStatus } from "@/lib/types";

const STATUSES: AppointmentStatus[] = [
  "confirmado",
  "aguardando",
  "concluido",
  "cancelado",
  "no-show",
  "bloqueado",
];

const WEEK_DAYS = [
  "2026-09-01",
  "2026-09-02",
  "2026-09-03",
  "2026-09-04",
  "2026-09-05",
  "2026-09-06",
  "2026-09-07",
];

export default function AgendaPage() {
  const {
    appointments,
    clients,
    professionals,
    services,
    updateAppointment,
    blockedSlots,
    toggleBlockedSlot,
    freeSlots,
  } = useStore();
  const [view, setView] = useState<"day" | "week">("day");
  const [professionalId, setProfessionalId] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (professionalId !== "all" && a.professionalId !== professionalId) {
        return false;
      }
      if (status !== "all" && a.status !== status) return false;
      if (view === "day" && a.date !== "2026-09-05") return false;
      if (view === "week" && !WEEK_DAYS.includes(a.date)) return false;
      return true;
    });
  }, [appointments, professionalId, status, view]);

  const professionalsOptions = useMemo(
    () =>
      professionals.filter((p) => p.active).map((p) => ({
        id: p.id,
        name: p.name,
      })),
    [professionals]
  );

  const daySlots = useMemo(() => {
    return freeSlots.filter((slot) =>
      view === "day"
        ? slot.startsWith("2026-09-05") || slot.startsWith("2026-09-06")
        : slot.includes("2026-09")
    );
  }, [freeSlots, view]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Quem → Quando → Serviço → Status"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setView("day")}>
              Dia
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setView("week")}>
              Semana
            </Button>
            <Link href="/agenda/novo">
              <Button size="sm">Novo</Button>
            </Link>
          </div>
        }
      />

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <label className="text-sm text-marka-gray">Profissional</label>
        <select
          className="h-9 rounded-md border border-marka-graphite/20 px-2 text-sm"
          value={professionalId}
          onChange={(e) => setProfessionalId(e.target.value)}
        >
          <option value="all">Todos</option>
          {professionalsOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <label className="text-sm text-marka-gray">Status</label>
        <select
          className="h-9 rounded-md border border-marka-graphite/20 px-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Todos</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum agendamento"
          description="Filtre ou crie um novo slot."
          action={
            <Link href="/agenda/novo">
              <Button size="sm">Criar</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const client = clients.find((c) => c.id === a.clientId);
            const service = services.find((s) => s.id === a.serviceId);
            const prof = professionals.find((p) => p.id === a.professionalId);
            return (
              <Card key={a.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {client?.name ?? "Cliente"} · {prof?.name ?? "—"}
                    </p>
                    <p className="text-sm text-marka-graphite">
                      {formatDateTime(a.date, a.time)} · {service?.name}
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      a.status === "cancelado"
                        ? "danger"
                        : a.status === "confirmado"
                          ? "success"
                          : a.status === "bloqueado"
                            ? "warning"
                            : "default"
                    }
                  >
                    {a.status}
                  </StatusBadge>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      updateAppointment(a.id, {
                        status: "cancelado",
                      })
                    }
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      updateAppointment(a.id, {
                        status: "bloqueado",
                      })
                    }
                  >
                    Bloquear
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {view === "day" || view === "week" ? (
        <Card className="p-4">
          <h2 className="mb-2 text-sm font-semibold">
            Horários livres (encaixe)
          </h2>
          <div className="flex flex-wrap gap-2">
            {daySlots.map((slot) => {
              const key = slot;
              const blocked = blockedSlots.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleBlockedSlot(key)}
                  className={
                    blocked
                      ? "rounded-md bg-marka-black px-3 py-1.5 text-xs text-marka-white"
                      : "rounded-md border border-marka-graphite/20 px-3 py-1.5 text-xs"
                  }
                >
                  {key}
                </button>
              );
            })}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
