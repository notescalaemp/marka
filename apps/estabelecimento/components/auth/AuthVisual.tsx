import { CalendarDays, Sparkles, Users } from "lucide-react";
import { MarkaMark } from "@/components/MarkaMark";

export function AuthVisual() {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-marka-navy p-5 sm:p-7">
      <div className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-marka-green-accent/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-12 h-56 w-56 rounded-full bg-marka-green-pale/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(48,149,119,0.16),transparent_55%)]" />

      <MarkaMark className="relative z-10 text-white" />

      <div className="relative z-10">
        <p className="hidden text-[11px] font-medium uppercase tracking-widest text-marka-green-pale/80 sm:block">
          marka.ia · estabelecimento
        </p>
        <h2 className="mt-2 text-lg font-semibold leading-snug text-white sm:mt-3 sm:text-xl lg:text-2xl">
          Sua operação, do jeito que ela merece ser.
        </h2>
        <p className="mt-2 hidden text-sm leading-relaxed text-white/60 sm:block">
          Agenda, clientes e automação em um só lugar.
        </p>
      </div>

      <div className="relative z-10 hidden flex-wrap gap-2 sm:flex">
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-2 backdrop-blur-xl">
          <CalendarDays className="h-3.5 w-3.5 text-marka-green-pale" />
          <span className="text-xs font-medium text-white">Agenda</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-2 backdrop-blur-xl">
          <Users className="h-3.5 w-3.5 text-marka-green-pale" />
          <span className="text-xs font-medium text-white">Clientes</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-2.5 py-2 backdrop-blur-xl">
          <Sparkles className="h-3.5 w-3.5 text-marka-green-pale" />
          <span className="text-xs font-medium text-white">Automação</span>
        </div>
      </div>
    </div>
  );
}
