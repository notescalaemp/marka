"use client";

import { useMemo, useState } from "react";
import { Button } from "@marka/ui/button";
import { Card } from "@marka/ui/card";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { OnboardingStep } from "@/lib/types";
import { useToast } from "@/components/ToastProvider";
import { EmptyState } from "@/components/EmptyState";

const STEPS: {
  id: OnboardingStep;
  title: string;
  description: string;
}[] = [
  {
    id: "estabelecimento",
    title: "1 · Estabelecimento",
    description: "Nome, categoria e cidade.",
  },
  {
    id: "basicos",
    title: "2 · Informações básicas",
    description: "Contato e endereço.",
  },
  {
    id: "horarios",
    title: "3 · Horário de funcionamento",
    description: "Defina o horário operacional.",
  },
  {
    id: "servicos",
    title: "4 · Adicionar serviços",
    description: "Serviços base do negócio.",
  },
  {
    id: "profissionais",
    title: "5 · Adicionar profissionais",
    description: "Equipe e papéis.",
  },
  {
    id: "agenda",
    title: "6 · Configurar agenda",
    description: "Slots e disponibilidade.",
  },
  {
    id: "finalizar",
    title: "7 · Finalizar",
    description: "Pronto para operar.",
  },
];

export default function OnboardingPage() {
  const {
    onboardingStep,
    completeOnboarding,
    establishment,
    updateEstablishment,
    services,
    addService,
    addProfessional,
    professionals,
    freeSlots,
    toggleBlockedSlot,
    blockedSlots,
  } = useStore();
  const router = useRouter();
  const toast = useToast();
  const stepIndex = STEPS.findIndex((s) => s.id === onboardingStep);

  const [profName, setProfName] = useState("");
  const [hours, setHours] = useState(establishment.hours);
  const [phone, setPhone] = useState(establishment.phone);

  const progress = Math.min(stepIndex + 1, STEPS.length);

  function next() {
    const current = STEPS[stepIndex];
    if (!current) return;
    if (current.id === "finalizar") {
      completeOnboarding("finalizar");
      toast.show("Onboarding concluído");
      router.push("/dashboard");
      return;
    }
    const nextStep = STEPS[stepIndex + 1];
    completeOnboarding(nextStep.id);
    toast.show(`Passo: ${nextStep.title}`);
  }

  function prev() {
    if (stepIndex <= 0) return;
    completeOnboarding(STEPS[stepIndex - 1].id);
  }

  const freeSlotsSummary = useMemo(
    () => freeSlots.slice(0, 5).join(" · ") || "Nenhum slot livre",
    [freeSlots]
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-sm text-marka-gray">Onboarding</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Configure o estabelecimento
        </h1>
        <p className="mt-1 text-sm text-marka-gray">
          Progresso: {progress}/{STEPS.length}
        </p>
      </div>

      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={
              i <= stepIndex
                ? "h-1.5 flex-1 rounded bg-marka-black"
                : "h-1.5 flex-1 rounded bg-marka-graphite/10"
            }
          />
        ))}
      </div>

      <Card className="space-y-4 p-5">
        <p className="text-xs font-medium text-marka-gray">
          {STEPS[stepIndex]?.title}
        </p>
        <h2 className="text-lg font-semibold">
          {STEPS[stepIndex]?.description}
        </h2>

        {["estabelecimento", "basicos", "horarios"].includes(onboardingStep) && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <input
              className="h-10 w-full rounded-md border border-marka-graphite/20 px-3 text-sm"
              defaultValue={establishment.name}
              onChange={(e) =>
                updateEstablishment({ name: e.target.value })
              }
            />
            <label className="text-sm font-medium">Categoria</label>
            <select
              className="h-10 w-full rounded-md border border-marka-graphite/20 px-3 text-sm"
              defaultValue={establishment.category}
              onChange={(e) =>
                updateEstablishment({
                  category: e.target.value as
                    | "nails"
                    | "barbearia"
                    | "lash-designer",
                })
              }
            >
              <option value="nails">Nails</option>
              <option value="barbearia">Barbearia</option>
              <option value="lash-designer">Lash Designer</option>
            </select>
            <label className="text-sm font-medium">Telefone</label>
            <input
              className="h-10 w-full rounded-md border border-marka-graphite/20 px-3 text-sm"
              defaultValue={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        )}

        {onboardingStep === "servicos" && (
          <div className="space-y-2">
            <p className="text-sm">
              {services.length} serviço(s) cadastrado(s).
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                addService({
                  name: "Serviço de exemplo",
                  description: "Exemplo para MVP",
                  price: 80,
                  durationMin: 45,
                  category: "Nails",
                  professionals: [],
                });
              }}
            >
              Adicionar serviço de exemplo
            </Button>
          </div>
        )}

        {onboardingStep === "profissionais" && (
          <div className="space-y-2">
            <p className="text-sm">
              {professionals.length} profissional(is) na equipe.
            </p>
            <input
              className="h-10 w-full rounded-md border border-marka-graphite/20 px-3 text-sm"
              placeholder="Nome do profissional"
              value={profName}
              onChange={(e) => setProfName(e.target.value)}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (!profName.trim()) return;
                addProfessional({
                  name: profName,
                  photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
                  specialties: ["Geral"],
                  services: services.map((s) => s.name).slice(0, 2),
                  role: "PROFESSIONAL",
                  active: true,
                  commissionPercent: 20,
                });
                setProfName("");
              }}
            >
              Adicionar profissional
            </Button>
          </div>
        )}

        {onboardingStep === "agenda" && (
          <div className="space-y-3">
            <p className="text-sm">
              Horário de funcionamento: {hours}
            </p>
            <input
              className="h-10 w-full rounded-md border border-marka-graphite/20 px-3 text-sm"
              defaultValue={hours}
              onChange={(e) => setHours(e.target.value)}
            />
            <p className="text-sm">
              Horários livres: {freeSlotsSummary}
            </p>
            <div className="flex flex-wrap gap-2">
              {freeSlots.slice(0, 6).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => toggleBlockedSlot(slot)}
                  className={
                    blockedSlots.includes(slot)
                      ? "rounded-md bg-marka-black px-3 py-1.5 text-xs text-marka-white"
                      : "rounded-md border border-marka-graphite/20 px-3 py-1.5 text-xs"
                  }
                >
                  {slot.split(":")[1] || slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {onboardingStep === "finalizar" && (
          <div className="rounded-md bg-marka-off p-3 text-sm">
            Setup completo. Você pode operar o Dashboard e a Agenda.
          </div>
        )}
      </Card>

      {stepIndex === -1 ? (
        <EmptyState
          title="Onboarding incompleto"
          description="Selecione um passo para continuar."
        />
      ) : null}

      <div className="flex gap-2">
        <Button variant="secondary" onClick={prev} disabled={stepIndex <= 0}>
          Voltar
        </Button>
        <Button className="flex-1" onClick={next}>
          {onboardingStep === "finalizar" ? "Finalizar" : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
