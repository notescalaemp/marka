import { Reveal } from "./Reveal";

const SEGMENTS = [
  "Barbearias",
  "Salões de beleza",
  "Clínicas de estética",
  "Lash designers",
  "Profissionais autônomos",
  "Estúdios de beleza",
];

export function SocialProof() {
  return (
    <section className="border-y border-marka-line bg-white py-10">
      <Reveal className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        <p className="text-sm font-medium text-marka-gray">
          Feito para o dia a dia de quem vive de atender bem e crescer com consistência
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {SEGMENTS.map((segment) => (
            <span key={segment} className="text-sm font-semibold tracking-tight text-marka-gray">
              {segment}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
