import { Scissors, Sparkles, Stethoscope, Eye, Briefcase } from "lucide-react";
import { Reveal } from "./Reveal";

const SECTORS = [
  {
    icon: Scissors,
    title: "Barbearias",
    description: "Agenda cheia, comissões organizadas e clientes fiéis sempre voltando.",
  },
  {
    icon: Sparkles,
    title: "Salões de beleza",
    description: "Vários profissionais, serviços e horários coordenados em um só lugar.",
  },
  {
    icon: Stethoscope,
    title: "Clínicas de estética",
    description: "Histórico de procedimentos, retornos e relacionamento de longo prazo.",
  },
  {
    icon: Eye,
    title: "Lash designers",
    description: "Controle fino de agenda e lembretes para procedimentos com manutenção periódica.",
  },
  {
    icon: Briefcase,
    title: "Profissionais autônomos",
    description: "Toda a operação de um negócio, sem precisar de uma equipe para tocar.",
  },
];

export function Sectors() {
  return (
    <section id="setores" className="bg-marka-off py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Setores</span>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-marka-black sm:text-4xl">
            Feito para quem vive de atender pessoas
          </h2>
          <p className="mt-4 text-balance text-marka-gray">
            Um sistema flexível o suficiente para se adaptar à realidade do seu setor.
          </p>
        </Reveal>

        <Reveal stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SECTORS.map((sector) => (
            <div key={sector.title} className="card card-interactive group p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-marka-green-tint text-marka-green transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:group-hover:scale-100">
                <sector.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-marka-black">{sector.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-marka-gray">{sector.description}</p>
            </div>
          ))}

          <div className="card-tint card-interactive flex flex-col justify-center p-8">
            <p className="text-lg font-semibold text-marka-green">Não achou seu setor?</p>
            <p className="mt-2 text-sm leading-relaxed text-marka-gray">
              O Marka IA se adapta a qualquer negócio local baseado em agendamento e relacionamento com clientes.
            </p>
            <a href="#demo" className="mt-4 text-sm font-semibold text-marka-green underline underline-offset-4">
              Fale com a gente
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
