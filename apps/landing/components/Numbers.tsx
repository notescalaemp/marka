import { CalendarClock, HeartHandshake, Clock3, TrendingUp } from "lucide-react";
import { Reveal } from "./Reveal";

const METRICS = [
  {
    icon: CalendarClock,
    trend: "Menos faltas",
    description: "Lembretes automáticos reduzem cancelamentos e horários vagos de última hora.",
  },
  {
    icon: HeartHandshake,
    trend: "Mais clientes reativados",
    description: "A IA identifica e recupera clientes que parariam de voltar.",
  },
  {
    icon: Clock3,
    trend: "Menos tempo em tarefas manuais",
    description: "Agenda, lembretes e cobranças rodam sozinhos no dia a dia.",
  },
  {
    icon: TrendingUp,
    trend: "Crescimento mais previsível",
    description: "Decisões guiadas por indicadores claros de agenda, clientes e financeiro.",
  },
];

export function Numbers() {
  return (
    <section id="numeros" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Impacto</span>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-marka-black sm:text-4xl">
            O que muda no seu negócio com o Marka IA
          </h2>
          <p className="mt-4 text-balance text-marka-gray">
            Resultados que crescem junto com a base de estabelecimentos que confiam no Marka IA.
          </p>
        </Reveal>

        <Reveal stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric) => (
            <div key={metric.trend} className="card card-interactive group p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-marka-green-tint text-marka-green transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:group-hover:scale-100">
                <metric.icon className="h-5 w-5" />
              </span>
              <p className="mt-5 text-lg font-semibold tracking-tight text-marka-black">
                {metric.trend}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-marka-gray">{metric.description}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
