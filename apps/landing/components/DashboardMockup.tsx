import {
  Calendar,
  Users,
  Bell,
  Wallet,
  Megaphone,
  UserCog,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type MockupKind =
  | "agenda"
  | "lembretes"
  | "clientes"
  | "profissionais"
  | "campanhas"
  | "financeiro";

const NAV_ITEMS: { key: MockupKind; label: string; icon: typeof Calendar }[] = [
  { key: "agenda", label: "Agenda", icon: Calendar },
  { key: "lembretes", label: "Lembretes", icon: Bell },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "profissionais", label: "Equipe", icon: UserCog },
  { key: "campanhas", label: "Campanhas", icon: Megaphone },
  { key: "financeiro", label: "Financeiro", icon: Wallet },
];

function Bar({ width, tone = "green" }: { width: string; tone?: "green" | "gray" }) {
  const tones = {
    green: "bg-marka-green/60",
    gray: "bg-marka-black/10",
  } as const;
  return <span className={cn("block h-1.5 rounded-full", tones[tone])} style={{ width }} />;
}

function AgendaBody() {
  const rows = [
    { time: "09:00", name: "Rafael Souza", service: "Corte + Barba", state: "confirmado" },
    { time: "10:30", name: "Camila Reis", service: "Coloração", state: "confirmado" },
    { time: "12:00", name: "Bruno Alves", service: "Corte", state: "aguardando" },
    { time: "14:15", name: "Marina Lopes", service: "Design de sobrancelha", state: "confirmado" },
    { time: "16:00", name: "João Pedro", service: "Barba", state: "confirmado" },
  ];
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-marka-black">Hoje, terça-feira</p>
        <span className="rounded-full bg-marka-green-tint px-2.5 py-1 text-[10px] font-semibold text-marka-green">
          Agenda 92% cheia
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div
            key={row.time}
            className="flex items-center gap-3 rounded-xl border border-marka-line bg-white px-3 py-2"
          >
            <span className="w-11 shrink-0 text-[11px] font-semibold text-marka-gray">{row.time}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-marka-black">{row.name}</p>
              <p className="truncate text-[11px] text-marka-gray">{row.service}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                row.state === "confirmado"
                  ? "bg-marka-green-tint text-marka-green"
                  : "bg-amber-50 text-amber-600"
              )}
            >
              {row.state}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LembretesBody() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <p className="text-xs font-semibold text-marka-black">Automações ativas</p>
      {[
        { label: "Lembrete 24h antes", detail: "WhatsApp · 128 enviados hoje" },
        { label: "Confirmação de horário", detail: "WhatsApp · resposta em 1 clique" },
        { label: "Reativação 60 dias sem visita", detail: "IA seleciona clientes automaticamente" },
      ].map((item) => (
        <div key={item.label} className="rounded-xl border border-marka-line bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-marka-black">{item.label}</p>
            <span className="inline-flex h-4 w-7 items-center rounded-full bg-marka-green p-0.5">
              <span className="h-3 w-3 translate-x-3 rounded-full bg-white transition-transform" />
            </span>
          </div>
          <p className="mt-1 text-[11px] text-marka-gray">{item.detail}</p>
        </div>
      ))}
      <div className="mt-1 flex items-center gap-2 rounded-xl bg-marka-green-tint p-3">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-marka-green" />
        <p className="text-[11px] font-medium text-marka-green">
          Lembrete enviado a Marina Lopes agora
        </p>
      </div>
    </div>
  );
}

function ClientesBody() {
  const clients = [
    { name: "Ana Beatriz", tag: "Cliente fiel", visits: "18 visitas" },
    { name: "Rafael Souza", tag: "Reativado pela IA", visits: "voltou após 74 dias" },
    { name: "Camila Reis", tag: "Novo cliente", visits: "1ª visita" },
    { name: "Bruno Alves", tag: "Risco de churn", visits: "sem visitas há 45 dias" },
  ];
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <p className="text-xs font-semibold text-marka-black">Base de clientes</p>
      {clients.map((c) => (
        <div key={c.name} className="flex items-center gap-3 rounded-xl border border-marka-line bg-white p-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-marka-green-tint text-[11px] font-semibold text-marka-green">
            {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-marka-black">{c.name}</p>
            <p className="truncate text-[11px] text-marka-gray">{c.visits}</p>
          </div>
          <span className="shrink-0 rounded-full bg-marka-off px-2 py-0.5 text-[10px] font-medium text-marka-gray">
            {c.tag}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProfissionaisBody() {
  const team = [
    { name: "Diego Martins", role: "Barbeiro", occ: 88 },
    { name: "Larissa Faria", role: "Colorista", occ: 74 },
    { name: "Pedro Nunes", role: "Barbeiro", occ: 95 },
  ];
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <p className="text-xs font-semibold text-marka-black">Ocupação da equipe hoje</p>
      {team.map((p) => (
        <div key={p.name} className="rounded-xl border border-marka-line bg-white p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-marka-black">{p.name}</p>
              <p className="text-[11px] text-marka-gray">{p.role}</p>
            </div>
            <span className="text-xs font-semibold text-marka-green">{p.occ}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-marka-black/[0.06]">
            <div className="h-full rounded-full bg-marka-green" style={{ width: `${p.occ}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CampanhasBody() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <p className="text-xs font-semibold text-marka-black">Campanhas da IA</p>
      {[
        { title: "Reative clientes inativos", stat: "42 clientes elegíveis", tone: "green" },
        { title: "Aniversariantes do mês", stat: "16 mensagens agendadas", tone: "gray" },
        { title: "Promoção horário vago", stat: "envio automático às 17h", tone: "gray" },
      ].map((c) => (
        <div key={c.title} className="rounded-xl border border-marka-line bg-white p-3">
          <p className="text-xs font-semibold text-marka-black">{c.title}</p>
          <p className="mt-1 text-[11px] text-marka-gray">{c.stat}</p>
          <div className="mt-2">
            <Bar width={c.tone === "green" ? "70%" : "40%"} tone={c.tone as "green" | "gray"} />
          </div>
        </div>
      ))}
    </div>
  );
}

function FinanceiroBody() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-marka-black">Fluxo de caixa</p>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-marka-green">
          <TrendingUp className="h-3.5 w-3.5" /> em alta
        </span>
      </div>
      <div className="flex h-24 items-end gap-2 rounded-xl border border-marka-line bg-white p-3">
        {[40, 55, 48, 70, 62, 80, 92].map((h, i) => (
          <span key={i} className="flex-1 rounded-t-md bg-marka-green/70" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-marka-line bg-white p-3">
          <p className="text-[11px] text-marka-gray">Recebido no mês</p>
          <p className="text-sm font-semibold text-marka-black">↑ consistente</p>
        </div>
        <div className="rounded-xl border border-marka-line bg-white p-3">
          <p className="text-[11px] text-marka-gray">Repasses</p>
          <p className="text-sm font-semibold text-marka-black">automáticos</p>
        </div>
      </div>
    </div>
  );
}

const BODIES: Record<MockupKind, () => React.ReactElement> = {
  agenda: AgendaBody,
  lembretes: LembretesBody,
  clientes: ClientesBody,
  profissionais: ProfissionaisBody,
  campanhas: CampanhasBody,
  financeiro: FinanceiroBody,
};

export function DashboardMockup({
  kind = "agenda",
  className,
}: {
  kind?: MockupKind;
  className?: string;
}) {
  const Body = BODIES[kind];
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[22px] border border-marka-line bg-white shadow-panel",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-marka-line bg-marka-off/60 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-marka-black/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-marka-black/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-marka-black/10" />
        <span className="ml-3 rounded-full bg-white px-3 py-1 text-[10px] font-medium text-marka-gray">
          app.marka.ia
        </span>
      </div>
      <div className="flex">
        <div className="hidden w-14 shrink-0 flex-col items-center gap-3 border-r border-marka-line bg-marka-off/40 py-4 sm:flex">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-marka-green">
            <span className="h-1.5 w-1.5 rounded-[2px] bg-white" />
          </span>
          {NAV_ITEMS.map((item) => (
            <span
              key={item.key}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                item.key === kind ? "bg-marka-green text-white" : "text-marka-gray"
              )}
            >
              <item.icon className="h-4 w-4" />
            </span>
          ))}
        </div>
        <div className="min-h-[280px] flex-1">
          <Body />
        </div>
      </div>
    </div>
  );
}
