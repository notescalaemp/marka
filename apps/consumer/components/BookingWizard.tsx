"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  getEstablishmentBySlug,
  getSlots,
  listEstablishments,
  ApiError,
  type PaymentOption,
} from "@/lib/api";
import { toUiEstablishment, type Establishment, type Service, type Professional } from "@/lib/types";

type Step = "service" | "professional" | "date" | "time" | "confirm";

const STEPS: Step[] = ["service", "professional", "date", "time", "confirm"];

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextDays(count = 7) {
  const days: { label: string; iso: string }[] = [];
  const start = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      label: d.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      }),
      iso: toISODate(d),
    });
  }
  return days;
}

export function BookingWizard({
  initialEstSlug,
  initialServiceId,
  initialProfessionalId,
}: {
  initialEstSlug?: string;
  initialServiceId?: string;
  initialProfessionalId?: string;
}) {
  const router = useRouter();
  const { bookAppointment, authStatus } = useStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [estList, setEstList] = useState<Establishment[]>([]);
  const [est, setEst] = useState<Establishment | null>(null);
  const [loadingEst, setLoadingEst] = useState(Boolean(initialEstSlug));
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [professionalId, setProfessionalId] = useState(initialProfessionalId ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("local");
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initialEstSlug) {
      void listEstablishments({ pageSize: 50 }).then((data) => {
        setEstList(data.items.map(toUiEstablishment));
      });
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingEst(true);
      try {
        const data = await getEstablishmentBySlug(initialEstSlug);
        if (cancelled) return;
        const ui = toUiEstablishment(data);
        setEst(ui);
        if (ui.paymentOptions[0]) setPaymentOption(ui.paymentOptions[0]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Estabelecimento inválido");
        }
      } finally {
        if (!cancelled) setLoadingEst(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialEstSlug]);

  const services: Service[] = useMemo(() => {
    if (!est) return [];
    if (professionalId) {
      const prof = est.professionals.find((p) => p.id === professionalId);
      if (prof?.serviceIds?.length) {
        return est.services.filter((s) => prof.serviceIds!.includes(s.id));
      }
      if (prof) {
        return est.services.filter((s) => prof.services.includes(s.name));
      }
    }
    return est.services;
  }, [est, professionalId]);

  const professionals: Professional[] = useMemo(() => {
    if (!est) return [];
    if (serviceId) {
      const service = est.services.find((s) => s.id === serviceId);
      if (!service) return est.professionals;
      return est.professionals.filter((p) => {
        if (p.serviceIds?.length) return p.serviceIds.includes(service.id);
        if (p.services.length === 0) return true;
        return p.services.includes(service.name);
      });
    }
    return est.professionals;
  }, [est, serviceId]);

  const days = nextDays();
  const step = STEPS[stepIndex];

  useEffect(() => {
    if (step !== "time" || !est || !serviceId || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingSlots(true);
      setError("");
      try {
        const data = await getSlots({
          establishmentId: est.id,
          serviceId,
          professionalId: professionalId || undefined,
          date,
        });
        if (cancelled) return;
        setSlots(data.slots);
      } catch (err) {
        if (!cancelled) {
          setSlots([]);
          setError(err instanceof ApiError ? err.message : "Falha ao carregar horários");
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, est, serviceId, professionalId, date]);

  function go(next: number) {
    setError("");
    setStepIndex(next);
  }

  async function next() {
    if (step === "service" && !serviceId) {
      setError("Selecione um serviço.");
      return;
    }
    if (step === "professional" && !professionalId) {
      setError("Selecione um profissional.");
      return;
    }
    if (step === "date" && !date) {
      setError("Escolha uma data.");
      return;
    }
    if (step === "time" && !time) {
      setError("Escolha um horário.");
      return;
    }
    if (step === "confirm") {
      if (authStatus !== "authenticated") {
        setError("Faça login no Perfil para confirmar o agendamento.");
        return;
      }
      if (!est) return;
      setSubmitting(true);
      setError("");
      try {
        await bookAppointment({
          establishmentId: est.id,
          serviceId,
          professionalId: professionalId || undefined,
          date,
          time,
          paymentOption,
        });
        router.push("/agendamentos?confirmado=1");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Falha ao confirmar");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    go(stepIndex + 1);
  }

  function prev() {
    if (stepIndex === 0) return;
    setError("");
    setStepIndex(stepIndex - 1);
  }

  if (loadingEst) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!est) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-marka-gray">
          Escolha o estabelecimento no qual você quer agendar.
        </p>
        <div className="space-y-2">
          {estList.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                setEst(e);
                if (e.paymentOptions[0]) setPaymentOption(e.paymentOptions[0]);
                setServiceId("");
                setProfessionalId("");
                setDate("");
                setTime("");
                setStepIndex(0);
              }}
              className="w-full rounded-lg border border-marka-graphite/10 p-3 text-left hover:bg-marka-off"
            >
              <div className="font-medium">{e.name}</div>
              <p className="text-xs text-marka-gray">{e.category}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
      <p className="text-sm text-marka-gray">
        {step === "service" && "1 · Serviço"}
        {step === "professional" && "2 · Profissional"}
        {step === "date" && "3 · Data"}
        {step === "time" && "4 · Horário"}
        {step === "confirm" && "5 · Confirmação"}
      </p>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {step === "service" && (
        <div className="space-y-2">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServiceId(s.id)}
              className={
                serviceId === s.id
                  ? "w-full rounded-lg border-2 border-marka-black bg-marka-off p-3 text-left"
                  : "w-full rounded-lg border border-marka-graphite/10 p-3 text-left hover:bg-marka-off"
              }
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{s.name}</span>
                <span className="text-sm">{formatPrice(s.price)}</span>
              </div>
              <p className="text-xs text-marka-gray">
                {s.durationMin} min · {s.description}
              </p>
            </button>
          ))}
        </div>
      )}

      {step === "professional" && (
        <div className="space-y-2">
          {professionals.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProfessionalId(p.id)}
              className={
                professionalId === p.id
                  ? "w-full rounded-lg border-2 border-marka-black bg-marka-off p-3 text-left"
                  : "w-full rounded-lg border border-marka-graphite/10 p-3 text-left hover:bg-marka-off"
              }
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-marka-gray">{p.specialty}</div>
            </button>
          ))}
        </div>
      )}

      {step === "date" && (
        <div className="grid grid-cols-3 gap-2">
          {days.map((d) => (
            <button
              key={d.iso}
              type="button"
              onClick={() => {
                setDate(d.iso);
                setTime("");
              }}
              className={
                date === d.iso
                  ? "rounded-md bg-marka-black p-3 text-sm text-marka-white"
                  : "rounded-md border border-marka-graphite/10 p-3 text-sm"
              }
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {step === "time" && (
        <div className="space-y-3">
          {loadingSlots ? <Skeleton className="h-24 w-full" /> : null}
          {!loadingSlots && slots.filter((s) => s.available).length === 0 ? (
            <p className="text-sm text-marka-gray">Nenhum horário disponível neste dia.</p>
          ) : null}
          <div className="grid grid-cols-3 gap-2">
            {slots
              .filter((s) => s.available)
              .map((s) => (
                <button
                  key={s.time}
                  type="button"
                  onClick={() => setTime(s.time)}
                  className={
                    time === s.time
                      ? "rounded-md bg-marka-black p-3 text-sm text-marka-white"
                      : "rounded-md border border-marka-graphite/10 p-3 text-sm"
                  }
                >
                  {s.time}
                </button>
              ))}
          </div>
        </div>
      )}

      {step === "confirm" && (
        <Card className="space-y-3 p-4">
          <h3 className="font-semibold">Confirmar agendamento</h3>
          <p className="text-sm">
            <span className="text-marka-gray">Est.:</span> {est.name}
          </p>
          <p className="text-sm">
            <span className="text-marka-gray">Serviço:</span>{" "}
            {services.find((s) => s.id === serviceId)?.name}
          </p>
          <p className="text-sm">
            <span className="text-marka-gray">Prof:</span>{" "}
            {professionals.find((p) => p.id === professionalId)?.name}
          </p>
          <p className="text-sm">
            <span className="text-marka-gray">Quando:</span> {date} · {time}
          </p>
          <p className="text-sm">
            <span className="text-marka-gray">Valor:</span>{" "}
            {formatPrice(services.find((s) => s.id === serviceId)?.price ?? 0)}
          </p>
          <div className="space-y-2">
            <p className="text-sm text-marka-gray">Pagamento</p>
            <div className="flex flex-wrap gap-2">
              {est.paymentOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPaymentOption(opt)}
                  className={
                    paymentOption === opt
                      ? "rounded-md bg-marka-black px-3 py-1.5 text-sm text-marka-white"
                      : "rounded-md border border-marka-graphite/15 px-3 py-1.5 text-sm"
                  }
                >
                  {opt === "online" ? "Online" : "No estabelecimento"}
                </button>
              ))}
            </div>
          </div>
          {authStatus !== "authenticated" ? (
            <p className="text-sm text-marka-gray">
              Você precisa estar logado. Vá em Perfil para entrar.
            </p>
          ) : null}
        </Card>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="secondary" onClick={prev} disabled={stepIndex === 0 || submitting}>
          Voltar
        </Button>
        <Button className="flex-1" onClick={() => void next()} disabled={submitting}>
          {step === "confirm"
            ? submitting
              ? "Confirmando…"
              : "Confirmar agendamento"
            : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
