import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";

export function FinalCta() {
  return (
    <section className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="relative overflow-hidden rounded-[32px] border border-marka-line bg-marka-green-tint px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="aura -left-24 -top-24 h-72 w-72 bg-marka-green/15" aria-hidden />
          <div className="aura -right-24 -bottom-24 h-72 w-72 bg-marka-green-mid/15" aria-hidden />

          <div className="relative mx-auto flex max-w-2xl flex-col items-center">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-marka-black sm:text-4xl">
              Pronto para colocar a IA para trabalhar pelo seu negócio?
            </h2>
            <p className="mt-4 max-w-xl text-balance text-marka-gray">
              Comece agora ou converse com o nosso time em uma demonstração personalizada, sem compromisso.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#demo" className="btn-primary h-12 px-7 text-sm sm:text-base">
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#demo" className="btn-secondary h-12 px-7 text-sm sm:text-base">
                Agendar demonstração
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
