"use client";

import { useState } from "react";
import { UserCog } from "lucide-react";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { useStore } from "@/lib/store";

export function ImpersonationBanner() {
  const { impersonating, impersonatedName, exitImpersonation } = useStore();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!impersonating) return null;

  return (
    <>
      <div className="animate-fade-in-up border-b border-amber-200/70 bg-amber-50/90 px-4 py-2.5 backdrop-blur lg:px-8">
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-400/30 text-amber-900">
              <UserCog className="h-3.5 w-3.5" />
            </span>
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
