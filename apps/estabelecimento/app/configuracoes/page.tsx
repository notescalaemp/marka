"use client";

import { useState } from "react";
import { Button } from "@marka/ui/button";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ToastProvider";
import type { Establishment, Role } from "@/lib/types";

const TABS = [
  "estabelecimento",
  "perfil",
  "equipe",
  "horarios",
  "servicos",
  "pagamentos",
  "notificacoes",
  "integracoes",
  "assinatura",
  "seguranca",
] as const;

const ROLES: Role[] = ["OWNER", "ADMIN", "MANAGER", "PROFESSIONAL", "STAFF"];

export default function ConfigPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("estabelecimento");
  const {
    establishment,
    updateEstablishment,
    role,
    user,
    members,
    inviteMember,
    updateMember,
    removeMember,
    services,
  } = useStore();
  const toast = useToast();
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("STAFF");

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Organizadas por categoria" />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "pill pill-active"
                : "pill"
            }
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="space-y-3 p-4">
        <h2 className="font-semibold capitalize">{tab}</h2>

        {tab === "estabelecimento" && (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-marka-gray">Nome</span>
              <input
                className="field"
                value={establishment?.name ?? ""}
                onChange={(e) => updateEstablishment({ name: e.target.value })}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-marka-gray">Telefone</span>
              <input
                className="field"
                value={establishment?.phone ?? ""}
                onChange={(e) => updateEstablishment({ phone: e.target.value })}
              />
            </label>
            <label className="block space-y-1 text-sm sm:col-span-2">
              <span className="text-xs text-marka-gray">Endereço</span>
              <input
                className="field"
                value={establishment?.address ?? ""}
                onChange={(e) =>
                  updateEstablishment({ address: e.target.value })
                }
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-marka-gray">Cidade</span>
              <input
                className="field"
                value={establishment?.city ?? ""}
                onChange={(e) => updateEstablishment({ city: e.target.value })}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-xs text-marka-gray">Categoria</span>
              <select
                className="field"
                value={establishment?.category ?? "nails"}
                onChange={(e) =>
                  updateEstablishment({
                    category: e.target.value as Establishment["category"],
                  })
                }
              >
                <option value="nails">Nails</option>
                <option value="barbearia">Barbearia</option>
                <option value="lash-designer">Lash designer</option>
              </select>
            </label>
          </div>
        )}

        {tab === "perfil" && (
          <div className="space-y-2 text-sm">
            <p>
              Conta: <strong>{user?.email || "—"}</strong>
            </p>
            <p>
              Role atual: <strong>{role}</strong>
            </p>
            <p className="text-marka-gray">
              Dados de perfil do usuário logado (mock).
            </p>
          </div>
        )}

        {tab === "equipe" && (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                className="field"
                placeholder="Nome"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
              <input
                className="field"
                placeholder="E-mail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <select
                className="field"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
              >
                {ROLES.filter((r) => r !== "OWNER").map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (!inviteName.trim() || !inviteEmail.trim()) return;
                inviteMember({
                  name: inviteName.trim(),
                  email: inviteEmail.trim().toLowerCase(),
                  role: inviteRole,
                });
                setInviteName("");
                setInviteEmail("");
                toast.show("Convite enviado (mock)");
              }}
            >
              Convidar membro
            </Button>

            <ul className="divide-y divide-black/[0.06]">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-marka-gray">
                      {m.email} · {m.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="field-sm"
                      value={m.role}
                      disabled={m.role === "OWNER"}
                      onChange={(e) =>
                        updateMember(m.id, { role: e.target.value as Role })
                      }
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    {m.role !== "OWNER" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          removeMember(m.id);
                          toast.show("Membro removido");
                        }}
                      >
                        Remover
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "horarios" && (
          <label className="block space-y-1 text-sm">
            <span className="text-xs text-marka-gray">Funcionamento</span>
            <input
              className="field"
              value={establishment?.hours ?? ""}
              onChange={(e) => updateEstablishment({ hours: e.target.value })}
            />
          </label>
        )}

        {tab === "servicos" && (
          <ul className="space-y-2 text-sm">
            {services.map((s) => (
              <li key={s.id} className="flex justify-between gap-2">
                <span>
                  {s.name} · {s.active ? "ativo" : "inativo"}
                </span>
                <span className="text-marka-gray">{s.durationMin} min</span>
              </li>
            ))}
          </ul>
        )}

        {tab === "pagamentos" && (
          <p className="text-sm text-marka-gray">
            Formas aceitas: Pix, cartão e dinheiro. Comissões por profissional
            ficam no cadastro de cada um.
          </p>
        )}

        {tab === "notificacoes" && (
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Lembrete de agendamento (WhatsApp)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Alerta de estoque baixo
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              Resumo diário por e-mail
            </label>
          </div>
        )}

        {tab === "integracoes" && (
          <p className="text-sm text-marka-gray">
            Integrações de agenda e pagamento entram na conexão com o backend.
          </p>
        )}

        {tab === "assinatura" && (
          <div className="text-sm">
            <p>
              Plano: <strong>Starter</strong>
            </p>
            <p className="text-marka-gray">Limites do MVP mock.</p>
          </div>
        )}

        {tab === "seguranca" && (
          <div className="space-y-2 text-sm">
            <p>Sessão mock ativa para {user?.email || "visitante"}.</p>
            <p className="text-marka-gray">
              2FA e reset de senha entram com a API de auth.
            </p>
          </div>
        )}

        <Button
          size="sm"
          variant="secondary"
          onClick={() => toast.show("Configurações salvas")}
        >
          Salvar
        </Button>
      </Card>
    </div>
  );
}
