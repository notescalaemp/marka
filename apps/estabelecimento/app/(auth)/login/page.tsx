"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@marka/ui/button";
import { Input } from "@marka/ui/input";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ToastProvider";
import { GoogleIcon } from "@/components/auth/GoogleIcon";

export default function LoginPage() {
  const { login, authError, authStatus, establishmentId, memberships } =
    useStore();
  const router = useRouter();
  const toast = useToast();
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
      /* authError already reflects this in the store */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-marka-navy lg:text-[28px]">
          Bem-vindo de volta
        </h1>
        <p className="mt-1.5 text-sm text-marka-slate">
          Entre para continuar usando o Marka IA.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-marka-slate" htmlFor="password">
              Senha
            </label>
            <Link
              href="/esqueci-senha"
              className="text-xs font-medium text-marka-green hover:text-marka-green-dark"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {authError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{authError}</p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-black/10" />
        <span className="text-xs text-marka-slate">ou</span>
        <div className="h-px flex-1 bg-black/10" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full gap-2.5"
        onClick={() => toast.show("Login com Google em breve")}
      >
        <GoogleIcon className="h-4 w-4" />
        Continuar com Google
      </Button>
    </div>
  );
}
