import { Brain, LineChart, Repeat } from "lucide-react";
import { Reveal } from "./Reveal";

const PILLARS = [
  {
    icon: Brain,
    title: "Decide por você",
    description:
      "A IA analisa a operação em tempo real e antecipa ações — de encaixes de agenda a alertas de clientes em risco de sumir.",
  },
  {
    icon: Repeat,
    title: "Automatiza o que se repete",
    description:
      "Lembretes, confirmações, reativações e campanhas acontecem sozinhos, liberando tempo para o que importa: atender bem.",
  },
  {
    icon: LineChart,
    title: "Mostra o caminho do crescimento",
    description:
      "Indicadores claros de agenda, clientes e financeiro para você tomar decisões com dados, não com achismo.",
  },
];

export function Positioning() {
  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-32">
      <div className="aura -left-40 top-1/2 h-96 w-96 -translate-y-1/2 bg-marka-green/8" aria-hidden />
      <div className="aura -right-40 bottom-0 h-80 w-80 bg-marka-green-mid/8" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Mais que uma agenda</span>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-marka-black sm:text-4xl">
            O Marka IA não organiza só a agenda. Ele é o sistema de crescimento do seu negócio.
          </h2>
          <p className="mt-4 text-balance text-marka-gray">
            Cada interação vira aprendizado, cada aprendizado vira ação — para que seu estabelecimento cresça de forma contínua, não por acaso.
          </p>
        </Reveal>

        <Reveal stagger className="mt-14 grid gap-5 sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="card card-interactive group p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-marka-green-tint text-marka-green transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:group-hover:scale-100">
                <pillar.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-marka-black">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-marka-gray">{pillar.description}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
