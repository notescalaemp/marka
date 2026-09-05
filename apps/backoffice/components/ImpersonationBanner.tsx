"use client";

import { useState } from "react";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { useStore } from "@/lib/store";

export function ImpersonationBanner() {
  const { impersonating, impersonatedName, exitImpersonation } = useStore();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!impersonating) return null;

  return (
    <>
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-sm font-medium text-amber-900">
              Modo impersonation ativo · atuando como {impersonatedName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setConfirmOpen(true)}>
              Sair do modo
            </Button>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Sair do modo impersonation?"
        description="A sessão de suporte/debug será encerrada e registrada no audit log."
        confirmLabel="Sair"
        onConfirm={() => {
          setConfirmOpen(false);
          void exitImpersonation();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
