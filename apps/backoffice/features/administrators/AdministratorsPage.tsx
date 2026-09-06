"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Skeleton } from "@/components/Skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/Toast";
import {
  createAdminAdministrator,
  getAdminAdministrators,
  patchAdminAdministrator,
} from "@/lib/api";
import type { AdminAdministratorListItemDto } from "@/lib/api-types";
import type { AdminRole, Role } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

const ROLES = [
  "Super Admin",
  "Finance",
  "Support",
  "Operations",
  "Product",
  "Read Only",
] as const;

const ROLE_LABEL_TO_API: Record<AdminRole, Role> = {
  "Super Admin": "super_admin",
  Finance: "finance",
  Support: "support",
  Operations: "operations",
  Product: "product",
  "Read Only": "read_only",
};

export function AdministratorsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<"all" | AdminRole>("all");
  const [status, setStatus] = useState<"all" | "ativo" | "inativo">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [admins, setAdmins] = useState<AdminAdministratorListItemDto[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<AdminRole>("Support");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminAdministrators();
      setAdmins(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar administradores"
      );
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return admins.filter((a) => {
      if (role !== "all" && a.role !== role) return false;
      if (status !== "all" && a.status !== status) return false;
      return true;
    });
  }, [role, status, admins]);

  const superAdminCount = admins.filter((a) => a.role === "Super Admin").length;
  const readOnlyCount = admins.filter((a) => a.role === "Read Only").length;

  async function toggleStatus(admin: AdminAdministratorListItemDto) {
    setSaving(true);
    try {
      await patchAdminAdministrator(admin.id, {
        status: admin.status === "ativo" ? "SUSPENDED" : "ACTIVE",
      });
      toast.show(
        admin.status === "ativo"
          ? "Administrador desativado"
          : "Administrador ativado"
      );
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Erro ao atualizar status");
    } finally {
      setSaving(false);
      setConfirmId(null);
    }
  }

  async function handleCreate() {
    if (!createName.trim() || !createEmail.trim() || createPassword.length < 8) {
      toast.show("Nome, e-mail e senha (mín. 8) são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      await createAdminAdministrator({
        name: createName.trim(),
        email: createEmail.trim(),
        password: createPassword,
        role: ROLE_LABEL_TO_API[createRole],
      });
      setShowCreate(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      toast.show("Administrador criado");
      await load();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Erro ao criar administrador");
    } finally {
      setSaving(false);
    }
  }

  if (loading && admins.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error && admins.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Administrators"
          description="Gerenciamento de administradores internos."
        />
        <ErrorState description={error} onRetry={() => void load()} />
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
          { label: "Super Admin", value: String(superAdminCount) },
          { label: "Read Only", value: String(readOnlyCount) },
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
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "all" | AdminRole)}
            className="field-sm"
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
            className="field-sm"
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
              <tr className="table-head-row">
                <th className="table-head-cell">Administrador</th>
                <th className="table-head-cell">Role</th>
                <th className="table-head-cell">Status</th>
                <th className="table-head-cell">Último login</th>
                <th className="table-head-cell">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="table-row"
                >
                  <td className="table-cell font-medium text-marka-black">{a.name}</td>
                  <td className="table-cell">{a.role}</td>
                  <td className="table-cell">
                    <span
                      className={
                        a.status === "ativo"
                          ? "text-marka-green-dark"
                          : "text-marka-gray"
                      }
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="table-cell text-marka-gray">
                    {a.lastLogin ? formatDateTime(a.lastLogin) : "—"}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs text-marka-green-dark underline"
                        disabled={saving}
                        onClick={() => {
                          if (a.status === "ativo") {
                            setConfirmId(a.id);
                          } else {
                            void toggleStatus(a);
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
        <div className="card p-4">
          <h2 className="text-sm font-medium text-marka-graphite">
            Novo administrador
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Nome"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="field-sm"
              aria-label="Nome do administrador"
            />
            <input
              placeholder="E-mail"
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              className="field-sm"
              aria-label="E-mail do administrador"
            />
            <input
              placeholder="Senha (mín. 8)"
              type="password"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              className="field-sm"
              aria-label="Senha"
            />
            <select
              className="field-sm"
              aria-label="Role"
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as AdminRole)}
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
            <Button size="sm" disabled={saving} onClick={() => void handleCreate()}>
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
          const admin = admins.find((a) => a.id === confirmId);
          if (admin) void toggleStatus(admin);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
