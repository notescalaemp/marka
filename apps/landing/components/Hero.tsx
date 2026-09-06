import { ArrowRight, CalendarCheck, MessageCircleHeart, UserRoundCheck } from "lucide-react";
import { DashboardMockup } from "./DashboardMockup";
import { NicheHeadline } from "./NicheHeadline";

const HERO_BACKGROUND = {
  backgroundImage: [
    "radial-gradient(38% 42% at 20% 15%, rgba(159,215,192,0.16) 0%, rgba(159,215,192,0) 70%)",
    "radial-gradient(34% 38% at 85% 85%, rgba(159,215,192,0.12) 0%, rgba(159,215,192,0) 70%)",
    "radial-gradient(65% 60% at 50% 38%, #6AC0A2 0%, rgba(106,192,162,0) 75%)",
    "linear-gradient(135deg, #309577 0%, #56B898 100%)",
  ].join(", "),
};

export function Hero() {
  return (
    <section
      id="home"
      className="bg-white px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6 lg:px-10 lg:pb-8 lg:pt-8"
    >
      <div className="relative overflow-hidden rounded-[28px] pb-24 pt-40 sm:rounded-[32px] sm:pb-32 sm:pt-48 lg:rounded-[40px]">
        <div className="absolute inset-0" style={HERO_BACKGROUND} aria-hidden />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Inteligência artificial para negócios de beleza e bem-estar
          </span>

          <h1 className="mt-6 max-w-2xl text-balance text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-4xl sm:leading-[1.1] md:text-5xl min-h-[4.6rem] sm:min-h-[5.5rem] md:min-h-[6.6rem]">
            IA feita para <NicheHeadline />
          </h1>

          <p className="mt-5 max-w-xl text-balance text-base leading-relaxed text-white sm:text-lg">
            Automatize sua operação, cuide melhor dos seus clientes e tenha mais tempo para fazer seu negócio crescer.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#demo" className="btn-hero-primary h-12 px-7 text-sm sm:text-base">
              Começar agora
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#demo" className="btn-hero-secondary h-12 px-7 text-sm sm:text-base">
              Agendar demonstração
            </a>
          </div>

          <div className="relative mt-16 w-full max-w-4xl sm:mt-24">
            <DashboardMockup kind="agenda" className="animate-scale-in" />

            <div className="pointer-events-none absolute -left-6 top-8 hidden w-52 animate-float rounded-2xl sm:-left-20 sm:block">
              <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-marka-line bg-white p-3.5 shadow-panel">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-marka-green-tint text-marka-green">
                  <CalendarCheck className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-marka-black">Agenda cheia</p>
                  <p className="text-[11px] text-marka-gray">92% dos horários ocupados</p>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -right-6 top-2 hidden w-56 animate-float-delay rounded-2xl sm:-right-16 sm:block">
              <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-marka-line bg-white p-3.5 shadow-panel">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-marka-green-tint text-marka-green">
                  <MessageCircleHeart className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-marka-black">Lembrete enviado</p>
                  <p className="text-[11px] text-marka-gray">Confirmação via WhatsApp</p>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-6 left-1/2 hidden w-60 -translate-x-1/2 animate-float rounded-2xl sm:block">
              <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-marka-line bg-white p-3.5 shadow-panel">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-marka-green-tint text-marka-green">
                  <UserRoundCheck className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-marka-black">Cliente reativado</p>
                  <p className="text-[11px] text-marka-gray">A IA trouxe de volta em 74 dias</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
