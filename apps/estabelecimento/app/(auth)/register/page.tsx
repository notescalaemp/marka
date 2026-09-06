"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@marka/ui/button";
import { Input } from "@marka/ui/input";
import { useStore } from "@/lib/store";

export default function RegisterPage() {
  const { register, authStatus, authError } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "authenticated") router.replace("/onboarding");
  }, [authStatus, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Informe seu nome.");
      return;
    }
    setSubmitting(true);
    try {
      await register({ name: name.trim(), email, password });
      router.replace("/onboarding");
    } catch {
      setError(authError ?? "Não foi possível criar a conta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-marka-navy lg:text-[28px]">
          Comece com o Marka IA
        </h1>
        <p className="mt-1.5 text-sm text-marka-slate">
          Crie sua conta e comece a transformar sua operação.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-marka-slate" htmlFor="name">
            Nome
          </label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-marka-slate" htmlFor="email">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-marka-slate" htmlFor="password">
            Senha
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {submitting ? "Criando..." : "Criar conta"}
        </Button>
      </form>
    </div>
  );
}
