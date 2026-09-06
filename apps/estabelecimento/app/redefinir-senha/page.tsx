"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@marka/ui/button";
import { Input } from "@marka/ui/input";
import { MarkaMark } from "@/components/MarkaMark";
import { confirmPasswordReset, ApiError } from "@/lib/api";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Link inválido ou incompleto.");
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível redefinir a senha.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm animate-fade-in-up space-y-6 card p-7">
      <div className="space-y-3 text-center">
        <MarkaMark className="mx-auto justify-center text-marka-black" />
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-marka-green-soft text-marka-green-dark">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-marka-navy">
            Defina uma nova senha
          </h1>
          <p className="mt-1 text-sm text-marka-slate">
            Escolha uma senha forte para sua conta.
          </p>
        </div>
      </div>

      {done ? (
        <div className="space-y-4 text-center">
          <p className="rounded-lg bg-marka-green-soft px-3 py-2.5 text-sm text-marka-green-dark">
            Senha atualizada com sucesso.
          </p>
          <Link href="/login" className="text-sm font-medium text-marka-green hover:text-marka-green-dark">
            Entrar agora
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-marka-slate" htmlFor="password">
              Nova senha
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
            {submitting ? "Salvando..." : "Redefinir senha"}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-marka-off bg-marka-mesh bg-no-repeat px-4">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
