import type { Appointment } from "./types";

export function buildInsights(params: {
  date: string;
  appointments: Appointment[];
  clients: Array<{
    ticketAvg: number;
    segment?: string;
    frequencyDays?: number;
  }>;
  products: Array<{
    stock: number;
    minStock: number;
    name: string;
  }>;
}) {
  const todayAppts = params.appointments.filter(
    (a) => a.date === params.date
  );
  const freeSlots = 5;
  const freeTomorrow = freeSlots;
  const delayedReturn = params.clients.filter(
    (c) =>
      c.segment === "risco" ||
      (c.segment === "inativos" && (c.frequencyDays ?? 0) > 40)
  );
  const avgTicket =
    params.clients.reduce((sum, c) => sum + c.ticketAvg, 0) /
    Math.max(params.clients.length, 1);
  const lowStock = params.products.filter((p) => p.stock <= p.minStock);

  return [
    {
      id: "slots",
      title: "5 horários livres amanhã",
      explanation: `${freeTomorrow} slots ainda abertos — ideal para campanha de retorno.`,
      actionLabel: "Preencher horários",
      href: "/agenda/novo",
    },
    {
      id: "return",
      title: `${delayedReturn.length} clientes atrasados para retornar`,
      explanation: "Priorize reativação de VIP e risco de inatividade.",
      actionLabel: "Ver clientes",
      href: "/clientes",
    },
    {
      id: "ticket",
      title: `Ticket médio R$ ${Math.round(avgTicket)}`,
      explanation: "Mantenha o ticket com serviços de maior valor.",
      actionLabel: "Ver financeiro",
      href: "/financeiro",
    },
    {
      id: "stock",
      title: lowStock.length
        ? `${lowStock[0]?.name ?? "Estoque"} em risco de esgotar`
        : "Estoque estável",
      explanation:
        lowStock.length
          ? `Reposição recomendada: ${lowStock[0]?.name}.`
          : "Nenhum alerta de estoque no momento.",
      actionLabel: lowStock.length ? "Ver estoque" : undefined,
      href: lowStock.length ? "/estoque" : undefined,
    },
    {
      id: "today",
      title: `Agenda de hoje: ${todayAppts.length} agendamentos`,
      explanation: "Confira o status e o encaixe de horários.",
      actionLabel: "Abrir agenda",
      href: "/agenda",
    },
  ];
}

export function buildCrmInsights(clients: Array<{ segment: string }>) {
  return [
    {
      id: "risk",
      title: "12 clientes estão atrasados para retornar",
      explanation: "Segmento em risco e inativos — priorize campanha.",
      actionLabel: "Ver clientes",
      href: "/clientes",
    },
    {
      id: "return",
      title: "18 clientes costumam retornar nesta semana",
      explanation: "Reative com promo de retorno ou aniversário.",
      actionLabel: "Criar campanha",
      href: "/marketing",
    },
  ];
}

export function countByStatus(list: Appointment[]) {
  return {
    confirmado: list.filter((a) => a.status === "confirmado").length,
    aguardando: list.filter((a) => a.status === "aguardando").length,
    concluido: list.filter((a) => a.status === "concluido").length,
    cancelado: list.filter((a) => a.status === "cancelado").length,
    noShow: list.filter((a) => a.status === "no-show").length,
    bloqueado: list.filter((a) => a.status === "bloqueado").length,
  };
}
