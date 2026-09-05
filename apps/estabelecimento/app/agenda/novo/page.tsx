"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@marka/ui/button";
import { Card } from "@marka/ui/card";
import { PageHeader } from "@marka/ui/page-header";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ToastProvider";

type Step = "cliente" | "profissional" | "servico" | "quando" | "confirm";

export default function NovoAgendamentoPage() {
  const { clients, services, professionals, addAppointment } = useStore();
  const toast = useToast();
  const router = useRouter();

  const [step, setStep] = useState<Step>("cliente");
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState("2026-09-06");
  const [time, setTime] = useState("14:00");
  const [error, setError] = useState("");

  const professionalServices = useMemo(() => {
    if (!professionalId) return services;
    return services.filter(
      (s) =>
        s.professionals.includes(professionalId) || s.professionals.length === 0
    );
  }, [services, professionalId]);

  const times = [
    "10:00",
    "11:00",
    "12:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
  ];

  const STEPS: Step[] = [
    "cliente",
    "profissional",
    "servico",
    "quando",
    "confirm",
  ];

  const stepIndex = STEPS.indexOf(step);

  function next() {
    setError("");
    const current = step;
    if (current === "cliente" && !clientId) {
      setError("Selecione um cliente.");
      return;
    }
    if (current === "profissional" && !professionalId) {
      setError("Selecione um profissional.");
      return;
    }
    if (current === "servico" && !serviceId) {
      setError("Selecione um serviço.");
      return;
    }
    if (current === "quando" && !date) {
      setError("Escolha uma data.");
      return;
    }
    if (current === "confirm") {
      addAppointment({
        clientId,
        serviceId,
        professionalId,
        date,
        time,
        status: "confirmado",
        notes: "Criado pelo fluxo rápido",
        payment: "local",
      });
      toast.show("Agendamento criado");
      router.push("/agenda");
      return;
    }
    setStep(STEPS[stepIndex + 1]);
  }


  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        title="Novo agendamento"
        description="Fluxo rápido com seleção contextual"
      />

      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={
              i <= stepIndex
                ? "h-1.5 flex-1 rounded bg-marka-black"
                : "h-1.5 flex-1 rounded bg-marka-graphite/10"
            }
          />
        ))}
      </div>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {step === "cliente" && (
        <Card className="space-y-2 p-4">
          <p className="text-sm font-medium">Cliente</p>
          <div className="space-y-2">
            {clients.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setClientId(c.id)}
                className={
                  clientId === c.id
                    ? "w-full rounded-md border-2 border-marka-black bg-marka-off p-3 text-left"
                    : "w-full rounded-md border border-marka-graphite/10 p-3 text-left hover:bg-marka-off"
                }
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-marka-gray">{c.phone}</div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === "profissional" && (
        <Card className="space-y-2 p-4">
          <p className="text-sm font-medium">Profissional</p>
          <div className="space-y-2">
            {professionals.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setProfessionalId(p.id);
                  setServiceId("");
                }}
                className={
                  professionalId === p.id
                    ? "w-full rounded-md border-2 border-marka-black bg-marka-off p-3 text-left"
                    : "w-full rounded-md border border-marka-graphite/10 p-3 text-left hover:bg-marka-off"
                }
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-marka-gray">
                  {p.specialties.join(" · ")}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === "servico" && (
        <Card className="space-y-2 p-4">
          <p className="text-sm font-medium">Serviço (filtrado pelo profissional)</p>
          <div className="space-y-2">
            {professionalServices.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setServiceId(s.id)}
                className={
                  serviceId === s.id
                    ? "w-full rounded-md border-2 border-marka-black bg-marka-off p-3 text-left"
                    : "w-full rounded-md border border-marka-graphite/10 p-3 text-left hover:bg-marka-off"
                }
              >
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-marka-gray">
                  {s.price.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === "quando" && (
        <Card className="space-y-3 p-4">
          <p className="text-sm font-medium">Data e horário</p>
          <input
            type="date"
            className="h-10 w-full rounded-md border border-marka-graphite/20 px-3 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="grid grid-cols-3 gap-2">
            {times.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(t)}
                className={
                  time === t
                    ? "rounded-md bg-marka-black p-3 text-sm text-marka-white"
                    : "rounded-md border border-marka-graphite/10 p-3 text-sm"
                }
              >
                {t}
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === "confirm" && (
        <Card className="space-y-2 p-4">
          <h3 className="font-semibold">Confirmar</h3>
          <p className="text-sm">
            Cliente: {clients.find((c) => c.id === clientId)?.name}
          </p>
          <p className="text-sm">
            Prof: {professionals.find((p) => p.id === professionalId)?.name}
          </p>
          <p className="text-sm">
            Serviço: {services.find((s) => s.id === serviceId)?.name}
          </p>
          <p className="text-sm">
            Quando: {date} · {time}
          </p>
        </Card>
      )}

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            if (step === "cliente") return;
            setStep(STEPS[Math.max(0, stepIndex - 1)]);
          }}
        >
          Voltar
        </Button>
        <Button className="flex-1" onClick={next}>
          {step === "confirm" ? "Confirmar" : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
