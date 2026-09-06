"use client";

import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "./Button";
import { Input } from "./Input";
import { MarkaMark } from "./MarkaMark";

export function LoginScreen() {
  const { login, authError } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      // authError already reflects this in the store
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-marka-off bg-marka-mesh bg-no-repeat px-4">
      <form
        onSubmit={handleSubmit}
        className="card w-full max-w-sm animate-fade-in-up space-y-5 p-7"
      >
        <div className="space-y-2 text-center">
          <MarkaMark className="mx-auto justify-center text-marka-black" />
          <div className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-marka-green-soft px-2.5 py-1 text-[11px] font-medium text-marka-green-dark">
            <ShieldCheck className="h-3 w-3" />
            Backoffice · Administração interna
          </div>
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
          <label className="text-xs font-medium text-marka-graphite" htmlFor="password">
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

        {authError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{authError}</p>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
