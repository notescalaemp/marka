"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { getMemory, type MemoryResponse } from "@/lib/api";

export function BeautyMemoryBanner() {
  const { authStatus } = useStore();
  const [memory, setMemory] = useState<MemoryResponse | null>(null);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setMemory(null);
      return;
    }
    let cancelled = false;
    void getMemory()
      .then((data) => {
        if (!cancelled) setMemory(data);
      })
      .catch(() => {
        if (!cancelled) setMemory(null);
      });
    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  if (!memory || memory.visitCount === 0) return null;

  const lastLabel = memory.lastVisitAt
    ? new Date(memory.lastVisitAt).toLocaleDateString("pt-BR")
    : null;

  return (
    <aside className="rounded-lg border border-marka-graphite/10 bg-marka-off px-4 py-3 text-sm text-marka-graphite">
      <p>
        {memory.lastServiceName
          ? `Seu último atendimento: ${memory.lastServiceName}`
          : "Seus atendimentos recentes estão disponíveis."}
        {lastLabel ? ` · ${lastLabel}` : ""}
      </p>
      <Link href="/agendamentos" className="mt-2 inline-block text-sm">
        Ver agendamentos
      </Link>
    </aside>
  );
}
