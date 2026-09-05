"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { administrators } from "@/lib/mock-data";
import type { AdminRole } from "@/lib/types";

const ROLES = [
  "Super Admin",
  "Finance",
  "Support",
  "Operations",
  "Product",
  "Read Only",
] as const;

export function AdministratorsPage() {
  const [loading] = useState(false);
  const [role, setRole] = useState<"all" | AdminRole>("all");
  const [status, setStatus] = useState<"all" | "ativo" | "inativo">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [admins, setAdmins] = useState(administrators);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const toast = useToast();

  const filtered = useMemo(() => {
    return admins.filter((a) => {
      if (role !== "all" && a.role !== role) return false;
      if (status !== "all" && a.status !== status) return false;
      return true;
    });
  }, [role, status, admins]);

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
        title="Administrators"
        description="Gerenciamento de administradores internos."
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            Novo administrador
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total", value: String(admins.length) },
          {
            label: "Ativos",
            value: String(admins.filter((a) => a.status === "ativo").length),
          },
          { label: "Super Admin", value: "1" },
          { label: "Read Only", value: "1" },
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
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "all" | AdminRole)}
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro role"
          >
            <option value="all">Todas as roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
            aria-label="Filtro status"
          >
            <option value="all">Todos os status</option>
            <option value="ativo">ativo</option>
            <option value="inativo">inativo</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-marka-graphite/10 text-xs text-marka-gray">
                <th className="px-2 py-2 font-medium">Administrador</th>
                <th className="px-2 py-2 font-medium">Role</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Último login</th>
                <th className="px-2 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-marka-graphite/5 hover:bg-marka-off/60"
                >
                  <td className="px-2 py-2 font-medium">{a.name}</td>
                  <td className="px-2 py-2">{a.role}</td>
                  <td className="px-2 py-2">
                    <span
                      className={
                        a.status === "ativo"
                          ? "text-emerald-700"
                          : "text-marka-gray"
                      }
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-marka-gray">{a.lastLogin}</td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs text-emerald-700 underline"
                        onClick={() => {
                          if (a.status === "ativo") {
                            setConfirmId(a.id);
                          } else {
                            setAdmins((prev) =>
                              prev.map((x) =>
                                x.id === a.id
                                  ? { ...x, status: "ativo" }
                                  : x
                              )
                            );
                            toast.show("Administrador ativado");
                          }
                        }}
                      >
                        {a.status === "ativo" ? "Desativar" : "Ativar"}
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
          <h2 className="text-sm font-medium text-marka-graphite">
            Novo administrador
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Nome"
              className="rounded-md border border-marka-graphite/20 px-2 py-1.5 text-xs"
              aria-label="Nome do administrador"
            />
            <select
              className="rounded-md border border-marka-graphite/20 bg-marka-white px-2 py-1.5 text-xs"
              aria-label="Role"
              defaultValue="Support"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowCreate(false);
                toast.show("Administrador criado");
              }}
            >
              Salvar
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Desativar administrador?"
        description="O usuário perderá acesso ao backoffice até ser reativado."
        confirmLabel="Desativar"
        onConfirm={() => {
          if (!confirmId) return;
          setAdmins((prev) =>
            prev.map((x) =>
              x.id === confirmId ? { ...x, status: "inativo" } : x
            )
          );
          toast.show("Administrador desativado");
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
