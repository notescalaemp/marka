"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@marka/ui/button";
import { Input } from "@marka/ui/input";
import { MarkaMark } from "@/components/MarkaMark";
import { requestPasswordReset, ApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar o link.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-marka-off bg-marka-mesh bg-no-repeat px-4">
      <div className="w-full max-w-sm animate-fade-in-up space-y-6 card p-7">
        <div className="space-y-3 text-center">
          <MarkaMark className="mx-auto justify-center text-marka-black" />
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-marka-green-soft text-marka-green-dark">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-marka-navy">
              Esqueceu sua senha?
            </h1>
            <p className="mt-1 text-sm text-marka-slate">
              Informe seu e-mail e enviaremos um link de recuperação.
            </p>
          </div>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="rounded-lg bg-marka-green-soft px-3 py-2.5 text-sm text-marka-green-dark">
              Se o e-mail existir, um link de recuperação foi enviado.
            </p>
            <Link href="/login" className="text-sm font-medium text-marka-green hover:text-marka-green-dark">
              Voltar para o login
            </Link>
          </div>
        ) : (
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

            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" loading={submitting}>
              {submitting ? "Enviando..." : "Enviar link de recuperação"}
            </Button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-sm font-medium text-marka-slate hover:text-marka-navy"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar para o login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
