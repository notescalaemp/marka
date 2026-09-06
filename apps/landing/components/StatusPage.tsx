"use client";

import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";

const SERVICES = [
  {
    name: "API",
    description: "Autenticação, agenda, clientes e financeiro da plataforma.",
  },
  {
    name: "Painel do estabelecimento",
    description: "Onde o negócio gerencia agenda, equipe, caixa e clientes.",
  },
  {
    name: "Área do cliente",
    description: "Onde o cliente agenda, confirma e acompanha atendimentos.",
  },
  {
    name: "Site",
    description: "Landing e páginas públicas do Marka.",
  },
];

function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function UptimeBars() {
  return (
    <div className="flex h-8 items-end gap-[3px]" aria-hidden>
      {Array.from({ length: 90 }, (_, i) => (
        <span
          key={i}
          className="h-full min-w-[2px] flex-1 rounded-[1px] bg-marka-green"
        />
      ))}
    </div>
  );
}

export function StatusPage() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-white text-marka-black">
      <header className="border-b border-marka-line">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <BrandLogo href="/" priority />
          <a href="/" className="text-sm font-medium text-marka-gray transition-colors hover:text-marka-black">
            Voltar ao site
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex items-start gap-3">
          <span className="mt-1.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-marka-green/15">
            <span className="h-2 w-2 rounded-full bg-marka-green" />
          </span>
          <div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-marka-black sm:text-4xl">
              Todos os serviços online
            </h1>
            <p className="mt-3 text-sm text-marka-gray">
              Atualizado em {now ? formatUpdatedAt(now) : "agora"}
            </p>
          </div>
        </div>

        <ul className="mt-12 flex flex-col gap-4">
          {SERVICES.map((service) => (
            <li key={service.name} className="rounded-3xl border border-marka-line bg-white p-5 shadow-xs sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-marka-black">{service.name}</p>
                  <p className="mt-1 text-sm text-marka-gray">{service.description}</p>
                </div>
                <span className="inline-flex h-8 items-center rounded-full bg-marka-green-tint px-3 text-xs font-semibold text-marka-green">
                  Operacional
                </span>
              </div>
              <div className="mt-5">
                <UptimeBars />
                <div className="mt-2 flex items-center justify-between text-[11px] text-marka-gray">
                  <span>90 dias atrás</span>
                  <span className="font-medium text-marka-green">100% uptime</span>
                  <span>Hoje</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
