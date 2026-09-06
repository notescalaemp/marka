"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Reveal } from "./Reveal";

const SEGMENTS = [
  "Barbearia",
  "Salão de beleza",
  "Clínica de estética",
  "Lash designer",
  "Profissional autônomo",
  "Outro",
];

type Status = "idle" | "submitting" | "success";

export function DemoForm() {
  const [status, setStatus] = useState<Status>("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    window.setTimeout(() => setStatus("success"), 900);
  }

  return (
    <section id="demo" className="bg-marka-off py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid overflow-hidden rounded-[28px] border border-marka-line bg-white shadow-card lg:grid-cols-2">
          <Reveal className="relative hidden overflow-hidden bg-marka-green-tint p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="aura -right-16 -top-16 h-64 w-64 bg-marka-green/15" aria-hidden />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-marka-green/20 bg-white px-3.5 py-1.5 text-xs font-medium text-marka-green">
                Demonstração gratuita
              </span>
              <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-marka-black">
                Veja o Marka IA rodando no seu tipo de negócio
              </h2>
              <p className="mt-4 text-balance text-marka-gray">
                Em uma conversa rápida, mostramos como a IA se encaixa na sua rotina e no seu setor.
              </p>
            </div>
            <ul className="relative mt-10 flex flex-col gap-3 text-sm text-marka-gray">
              {[
                "Sem compromisso e sem cartão de crédito",
                "Apresentação personalizada para o seu setor",
                "Suporte direto para tirar dúvidas",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-marka-green" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={80} className="p-8 sm:p-10">
            {status === "success" ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-marka-green-tint text-marka-green">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-marka-black">Pedido enviado!</h3>
                <p className="mt-2 max-w-xs text-sm text-marka-gray">
                  Recebemos seus dados. Nosso time entrará em contato para agendar a sua demonstração.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-marka-black">
                    Agende sua demonstração
                  </h3>
                  <p className="mt-1 text-sm text-marka-gray">Leva menos de um minuto.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className="text-xs font-medium text-marka-gray">
                      Nome
                    </label>
                    <input id="name" name="name" required placeholder="Seu nome" className="field" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="business" className="text-xs font-medium text-marka-gray">
                      Estabelecimento
                    </label>
                    <input
                      id="business"
                      name="business"
                      required
                      placeholder="Nome do negócio"
                      className="field"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="phone" className="text-xs font-medium text-marka-gray">
                      WhatsApp
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      required
                      placeholder="(00) 00000-0000"
                      className="field"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-xs font-medium text-marka-gray">
                      E-mail
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="voce@email.com"
                      className="field"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="segment" className="text-xs font-medium text-marka-gray">
                    Setor
                  </label>
                  <select id="segment" name="segment" required defaultValue="" className="field appearance-none">
                    <option value="" disabled>
                      Selecione o setor
                    </option>
                    {SEGMENTS.map((segment) => (
                      <option key={segment} value={segment}>
                        {segment}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="btn-primary mt-2 h-12 text-sm"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Agendar demonstração
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-marka-gray">
                  Ao enviar, você concorda em ser contatado pela nossa equipe.
                </p>
              </form>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
