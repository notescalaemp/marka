"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@marka/ui/button";
import { Input } from "@marka/ui/input";
import { MarkaMark } from "@/components/MarkaMark";
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
    <div className="flex min-h-screen items-center justify-center bg-marka-off px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-marka-graphite/10 bg-marka-white p-6"
      >
        <div className="space-y-1 text-center">
          <MarkaMark className="mx-auto text-marka-black" />
          <p className="text-sm text-marka-gray">Criar conta do estabelecimento</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-marka-graphite" htmlFor="name">
            Nome
          </label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-marka-graphite" htmlFor="email">
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

        <div className="space-y-2">
          <label
            className="text-xs font-medium text-marka-graphite"
            htmlFor="password"
          >
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

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Criando..." : "Criar conta"}
        </Button>

        <p className="text-center text-xs text-marka-gray">
          Já tem conta?{" "}
          <Link href="/login" className="underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
