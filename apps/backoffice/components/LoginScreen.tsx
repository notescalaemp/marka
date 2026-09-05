"use client";

import { useState, type FormEvent } from "react";
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
    <div className="flex min-h-screen items-center justify-center bg-marka-off px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border border-marka-graphite/10 bg-marka-white p-6"
      >
        <div className="space-y-1 text-center">
          <MarkaMark className="mx-auto text-marka-black" />
          <p className="text-sm text-marka-gray">Backoffice · Administração interna</p>
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

        {authError ? <p className="text-sm text-red-600">{authError}</p> : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
