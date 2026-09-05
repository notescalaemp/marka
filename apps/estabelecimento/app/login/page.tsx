"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@marka/ui/button";
import { Input } from "@marka/ui/input";
import { MarkaMark } from "@/components/MarkaMark";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const { login, authError, authStatus, establishmentId, memberships } =
    useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    if (memberships.length === 0) router.replace("/onboarding");
    else if (establishmentId) router.replace("/dashboard");
    else router.replace("/onboarding");
  }, [authStatus, establishmentId, memberships.length, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      /* authError no store */
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
          <p className="text-sm text-marka-gray">
            Estabelecimento · entrar na operação
          </p>
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {authError ? <p className="text-sm text-red-600">{authError}</p> : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </Button>

        <p className="text-center text-xs text-marka-gray">
          Não tem conta?{" "}
          <Link href="/register" className="underline">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
