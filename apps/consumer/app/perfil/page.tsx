"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import {
  requestEmailVerification,
  confirmEmailVerification,
  updateProfile,
  getMemory,
  ApiError,
  type MemoryResponse,
} from "@/lib/api";

function AuthForms() {
  const { login, register, authError } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register({ email, password, name });
      }
    } catch {
      // authError already reflects this in the store
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold">
        {mode === "login" ? "Entrar" : "Criar conta"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" ? (
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {authError ? <p className="text-sm text-red-600">{authError}</p> : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
        </Button>
      </form>

      <button
        type="button"
        className="w-full text-center text-sm text-marka-gray underline"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login" ? "Ainda não tem conta? Criar conta" : "Já tem conta? Entrar"}
      </button>
    </div>
  );
}

function EmailVerification({ verified }: { verified: boolean }) {
  const toast = useToast();
  const [token, setToken] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (verified) return null;

  async function handleResend() {
    setSending(true);
    try {
      await requestEmailVerification();
      toast.show("E-mail de verificação enviado.");
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "Não foi possível enviar o e-mail.");
    } finally {
      setSending(false);
    }
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setConfirming(true);
    try {
      await confirmEmailVerification(token);
      toast.show("E-mail verificado com sucesso.");
      setToken("");
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "Token inválido ou expirado.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <section className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4">
      <h2 className="text-sm font-medium text-amber-900">E-mail não verificado</h2>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" disabled={sending} onClick={handleResend}>
          {sending ? "Enviando..." : "Reenviar verificação"}
        </Button>
        <form onSubmit={handleConfirm} className="flex items-center gap-2">
          <Input
            placeholder="Cole o token recebido"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="h-9 w-56"
          />
          <Button size="sm" type="submit" disabled={confirming || !token}>
            {confirming ? "Verificando..." : "Verificar"}
          </Button>
        </form>
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const { user, authStatus, favorites, appointments, logout } = useStore();
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [memory, setMemory] = useState<MemoryResponse | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    void getMemory()
      .then(setMemory)
      .catch(() => setMemory(null));
  }, [authStatus]);

  if (authStatus === "loading") {
    return <p className="text-sm text-marka-gray">Carregando...</p>;
  }

  if (authStatus === "unauthenticated" || !user) {
    return <AuthForms />;
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ name, phone: phone || null });
      toast.show("Perfil atualizado.");
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Perfil</h1>

      <EmailVerification verified={Boolean(user.emailVerifiedAt)} />

      <section className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Nome</Label>
          <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-phone">Telefone</Label>
          <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <p className="text-sm text-marka-gray">{user.email}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Favoritos</h2>
        <p className="text-sm text-marka-graphite">
          {favorites.establishments.length} estabelecimentos ·{" "}
          {favorites.professionals.length} profissionais.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Agendamentos</h2>
        <p className="text-sm text-marka-graphite">
          {appointments.length} próximo(s) carregado(s).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Beauty Memory</h2>
        <p className="text-sm text-marka-graphite">
          {memory && memory.visitCount > 0
            ? `${memory.visitCount} atendimento(s) · último: ${memory.lastServiceName ?? "—"}`
            : "Ainda sem histórico suficiente."}
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" disabled={saving} onClick={() => void handleSave()}>
          {saving ? "Salvando…" : "Salvar perfil"}
        </Button>
        <Button variant="outline" onClick={() => void logout()}>
          Sair
        </Button>
      </div>
    </div>
  );
}
