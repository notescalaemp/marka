"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { CalendarDays, Bell, RefreshCw, TrendingUp, Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

const GREEN = "#309577";
const RED = "#EF4444";

/* ---------------------------------------------------------------------- */
/* Fixed geometry — every position and every connector path is derived    */
/* from these constants, so the SVG paths always line up with the cards.  */
/* ---------------------------------------------------------------------- */

const CARD_MAIN_W = 210;
const CARD_MAIN_H = 262;
const CARD_W = 190;
const CARD_H = 226;
const CARD_SMALL_W = 160;
const CARD_SMALL_H = 100;

const BRANCH_GAP = 48;
const MERGE_GAP = 48;
const MAIN_GAP = 40;
const V_GAP = 30;

const agenda = { x: 0, y: V_GAP + CARD_SMALL_H, w: CARD_MAIN_W, h: CARD_MAIN_H };
const topDecision = { x: agenda.x + agenda.w + BRANCH_GAP, y: 0, w: CARD_SMALL_W, h: CARD_SMALL_H };
const bottomDecision = {
  x: topDecision.x,
  y: agenda.y + agenda.h + V_GAP,
  w: CARD_SMALL_W,
  h: CARD_SMALL_H,
};
const mainAxisY = agenda.y + agenda.h / 2;
const lembrete = { x: topDecision.x + topDecision.w + MERGE_GAP, y: mainAxisY - CARD_H / 2, w: CARD_W, h: CARD_H };
const reativacao = { x: lembrete.x + lembrete.w + MAIN_GAP, y: lembrete.y, w: CARD_W, h: CARD_H };
const resultados = {
  x: reativacao.x + reativacao.w + MAIN_GAP,
  y: mainAxisY - CARD_MAIN_H / 2,
  w: CARD_MAIN_W,
  h: CARD_MAIN_H,
};

const TOTAL_W = resultados.x + resultados.w;
const TOTAL_H = bottomDecision.y + bottomDecision.h;

function edge(node: typeof agenda, side: "left" | "right") {
  return { x: side === "right" ? node.x + node.w : node.x, y: node.y + node.h / 2 };
}

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}

/** Cubic-bezier path plus an analytical arc-length approximation (average of the
 * chord and the control-polygon lengths — accurate to a couple percent for curves
 * this gentle). Computing it this way means every path already knows its own
 * length on the very first render, so there's no DOM-measurement step that could
 * ever cause the "wire snaps to fully-drawn for a frame" glitch. */
function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.max(Math.abs(x2 - x1) * 0.55, 28);
  const cx1 = x1 + dx;
  const cy1 = y1;
  const cx2 = x2 - dx;
  const cy2 = y2;
  const d = `M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
  const chord = dist(x1, y1, x2, y2);
  const controlPolygon = dist(x1, y1, cx1, cy1) + dist(cx1, cy1, cx2, cy2) + dist(cx2, cy2, x2, y2);
  const length = (chord + controlPolygon) / 2;
  return { d, length };
}

const agendaExit = edge(agenda, "right");
const PATH_TOP = bezierPath(agendaExit.x, agendaExit.y, topDecision.x, topDecision.y + topDecision.h / 2);
const PATH_BOTTOM = bezierPath(agendaExit.x, agendaExit.y, bottomDecision.x, bottomDecision.y + bottomDecision.h / 2);
const lembreteEntry = edge(lembrete, "left");
const PATH_MERGE_TOP = bezierPath(
  topDecision.x + topDecision.w,
  topDecision.y + topDecision.h / 2,
  lembreteEntry.x,
  lembreteEntry.y
);
const PATH_MERGE_BOTTOM = bezierPath(
  bottomDecision.x + bottomDecision.w,
  bottomDecision.y + bottomDecision.h / 2,
  lembreteEntry.x,
  lembreteEntry.y
);
const PATH_TO_REATIVACAO = bezierPath(
  edge(lembrete, "right").x,
  edge(lembrete, "right").y,
  edge(reativacao, "left").x,
  edge(reativacao, "left").y
);
const PATH_TO_RESULTADOS = bezierPath(
  edge(reativacao, "right").x,
  edge(reativacao, "right").y,
  edge(resultados, "left").x,
  edge(resultados, "left").y
);

/* ---------------------------------------------------------------------- */
/* Timeline — a hand-authored story, not a generic loop.                  */
/* ---------------------------------------------------------------------- */

const T = {
  agendaIn: 0,
  lineTop: 500,
  lineBottom: 600,
  lineDuration: 500,
  topCardIn: 1200,
  topCheckIn: 1350,
  bottomCardIn: 1450,
  bottomXIn: 1600,
  mergeLine: 1750,
  mergeDuration: 450,
  lembreteIn: 2150,
  bellWiggle: 2300,
  whatsappIn: 2450,
  lineToReativacao: 2600,
  lineToReativacaoDuration: 400,
  reativacaoIn: 2850,
  lineToResultados: 3050,
  lineToResultadosDuration: 400,
  resultadosIn: 3300,
  barsBase: 3450,
  barStep: 100,
  growthIndicator: 4200,
};

/* ---------------------------------------------------------------------- */
/* Reveal + timing hooks                                                  */
/* ---------------------------------------------------------------------- */

function useWorkflowReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, visible, reducedMotion };
}

function useTimedFlag(ms: number, visible: boolean, reducedMotion: boolean) {
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    if (reducedMotion) {
      setFlag(true);
      return;
    }
    if (!visible) return;
    const t = setTimeout(() => setFlag(true), ms);
    return () => clearTimeout(t);
  }, [visible, reducedMotion, ms]);
  return flag;
}

/* ---------------------------------------------------------------------- */
/* Connector primitives                                                   */
/* ---------------------------------------------------------------------- */

function DrawPath({
  d,
  length,
  delay,
  duration,
  visible,
  reducedMotion,
}: {
  d: string;
  length: number;
  delay: number;
  duration: number;
  visible: boolean;
  reducedMotion: boolean;
}) {
  const shown = reducedMotion || visible;
  return (
    <path
      d={d}
      fill="none"
      stroke={GREEN}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        strokeDasharray: length,
        strokeDashoffset: shown ? 0 : length,
        transition: `stroke-dashoffset ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        transitionDelay: reducedMotion || !visible ? "0ms" : `${delay}ms`,
      }}
    />
  );
}

function FlowDot({ d, start, dur = "0.9s" }: { d: string; start: boolean; dur?: string }) {
  if (!start) return null;
  return (
    <circle r={3.5} fill={GREEN} opacity={0.9}>
      <animateMotion path={d} dur={dur} fill="freeze" repeatCount={1} />
    </circle>
  );
}

/* ---------------------------------------------------------------------- */
/* Card shell                                                             */
/* ---------------------------------------------------------------------- */

function NodeCard({
  pos,
  delay,
  visible,
  reducedMotion,
  className,
  children,
}: {
  pos: { x: number; y: number; w: number; h: number };
  delay: number;
  visible: boolean;
  reducedMotion: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-visible={visible}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: pos.w,
        height: pos.h,
        transitionDelay: reducedMotion || !visible ? "0ms" : `${delay}ms`,
      }}
      className={cn("wf-reveal card-glass card-interactive flex flex-col p-4", className)}
    >
      {children}
    </div>
  );
}

function Fade({
  delay,
  visible,
  reducedMotion,
  className,
  children,
}: {
  delay: number;
  visible: boolean;
  reducedMotion: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-visible={visible}
      style={{ transitionDelay: reducedMotion || !visible ? "0ms" : `${delay}ms` }}
      className={cn("wf-reveal", className)}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Card content                                                           */
/* ---------------------------------------------------------------------- */

function AgendaContent({ visible, reducedMotion }: { visible: boolean; reducedMotion: boolean }) {
  const rows = [
    { time: "09:00", service: "Corte + Barba", name: "João Silva" },
    { time: "10:30", service: "Coloração", name: "Camila" },
    { time: "14:00", service: "Corte masculino", name: "Pedro" },
  ];
  return (
    <>
      <Fade delay={T.agendaIn + 60} visible={visible} reducedMotion={reducedMotion} className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-marka-green-tint text-marka-green">
          <CalendarDays className="h-4 w-4" />
        </span>
        <h3 className="text-[13px] font-semibold leading-tight text-marka-black">Agenda Inteligente</h3>
      </Fade>

      <Fade
        delay={T.agendaIn + 140}
        visible={visible}
        reducedMotion={reducedMotion}
        className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-marka-off px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-wide text-marka-gray"
      >
        Hoje · Terça-feira
      </Fade>

      <div className="mt-2.5 flex flex-1 flex-col gap-1.5">
        {rows.map((r, i) => (
          <Fade
            key={r.time}
            delay={T.agendaIn + 200 + i * 90}
            visible={visible}
            reducedMotion={reducedMotion}
            className="rounded-xl bg-marka-off/70 px-2.5 py-1.5"
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-marka-black">{r.time}</span>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-marka-green" />
              <span className="flex-1 truncate text-[10px] text-marka-gray">{r.service}</span>
            </div>
            <p className="mt-0.5 truncate text-[10px] font-medium text-marka-black/70">{r.name}</p>
          </Fade>
        ))}
      </div>
    </>
  );
}

function DecisionCard({
  tone,
  title,
  subtitle,
  detail,
  iconDelay,
  visible,
  reducedMotion,
}: {
  tone: "confirm" | "cancel";
  title: string;
  subtitle: string;
  detail?: string;
  iconDelay: number;
  visible: boolean;
  reducedMotion: boolean;
}) {
  const isConfirm = tone === "confirm";
  return (
    <div className="flex h-full flex-col justify-center gap-1.5">
      <div className="flex items-center gap-2">
        <span
          data-visible={visible}
          style={{
            transitionDelay: reducedMotion || !visible ? "0ms" : `${iconDelay}ms`,
            backgroundColor: isConfirm ? GREEN : RED,
          }}
          className="wf-reveal flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
        >
          {isConfirm ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3.5 w-3.5" strokeWidth={3} />}
        </span>
        <p className="text-[12px] font-semibold leading-tight text-marka-black">{title}</p>
      </div>
      <p className="text-[10.5px] text-marka-gray">{subtitle}</p>
      {detail && <p className="text-[9.5px] font-medium text-marka-black/60">{detail}</p>}
    </div>
  );
}

function LembreteContent({ visible, reducedMotion }: { visible: boolean; reducedMotion: boolean }) {
  const wiggle = useTimedFlag(T.bellWiggle, visible, reducedMotion);
  return (
    <>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-marka-green-tint text-marka-green",
            wiggle && !reducedMotion && "animate-bell-wiggle"
          )}
          style={{ transformOrigin: "50% 20%" }}
        >
          <Bell className="h-4 w-4" />
        </span>
        <h3 className="text-[13px] font-semibold leading-tight text-marka-black">Lembrete automático</h3>
      </div>

      <Fade
        delay={T.whatsappIn}
        visible={visible}
        reducedMotion={reducedMotion}
        className="mt-3 rounded-xl border border-marka-line bg-marka-off/70 p-2.5"
      >
        <p className="text-[10px] font-semibold text-marka-black">Marka IA</p>
        <p className="mt-1 text-[10px] leading-snug text-marka-gray">
          Seu horário é amanhã às 09:00. Tudo certo?
        </p>
      </Fade>

      <Fade
        delay={T.whatsappIn + 150}
        visible={visible}
        reducedMotion={reducedMotion}
        className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-marka-green-tint px-2 py-0.5 text-[9.5px] font-semibold text-marka-green"
      >
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
        Enviado automaticamente
      </Fade>
    </>
  );
}

function ReativacaoContent({ visible, reducedMotion }: { visible: boolean; reducedMotion: boolean }) {
  const clients = [
    { name: "Marina", days: 42 },
    { name: "João", days: 37 },
    { name: "Camila", days: 51 },
  ];
  return (
    <>
      <Fade delay={T.reativacaoIn + 60} visible={visible} reducedMotion={reducedMotion} className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-marka-green-tint text-marka-green">
          <RefreshCw className="h-4 w-4" />
        </span>
        <h3 className="text-[13px] font-semibold leading-tight text-marka-black">Reativação automática</h3>
      </Fade>

      <div className="mt-2.5 flex flex-1 flex-col gap-1.5">
        {clients.map((c, i) => (
          <Fade
            key={c.name}
            delay={T.reativacaoIn + 140 + i * 80}
            visible={visible}
            reducedMotion={reducedMotion}
            className="flex items-center justify-between rounded-lg bg-marka-off/70 px-2 py-1"
          >
            <span className="text-[10.5px] font-medium text-marka-black">{c.name}</span>
            <span className="text-[9.5px] text-marka-gray">Último atendimento · {c.days} dias</span>
          </Fade>
        ))}
      </div>

      <Fade
        delay={T.reativacaoIn + 140 + clients.length * 80 + 60}
        visible={visible}
        reducedMotion={reducedMotion}
        className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-marka-green-tint px-2 py-0.5 text-[9.5px] font-semibold text-marka-green"
      >
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
        Campanha enviada
      </Fade>
    </>
  );
}

function ResultadosContent({ visible, reducedMotion }: { visible: boolean; reducedMotion: boolean }) {
  const bars = [34, 52, 46, 68, 60, 88];
  const shown = reducedMotion || visible;
  return (
    <>
      <Fade
        delay={T.resultadosIn + 60}
        visible={visible}
        reducedMotion={reducedMotion}
        className="flex items-center gap-2"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-marka-green-tint text-marka-green">
          <TrendingUp className="h-4 w-4" />
        </span>
        <h3 className="text-[13px] font-semibold leading-tight text-marka-black">Resultados reais</h3>
      </Fade>

      <div className="mt-4 flex h-24 flex-1 items-end gap-2" aria-hidden>
        {bars.map((h, i) => (
          <span
            key={i}
            className={cn("flex-1 rounded-t-md", i % 2 === 0 ? "bg-marka-green" : "bg-marka-green-light")}
            style={{
              height: `${h}%`,
              transform: shown ? "scaleY(1)" : "scaleY(0)",
              transformOrigin: "bottom",
              transition: "transform 550ms cubic-bezier(0.16, 1, 0.3, 1)",
              transitionDelay: reducedMotion || !visible ? "0ms" : `${T.barsBase + i * T.barStep}ms`,
            }}
          />
        ))}
      </div>

      <Fade
        delay={T.growthIndicator}
        visible={visible}
        reducedMotion={reducedMotion}
        className="mt-2 inline-flex w-fit items-center gap-1 text-[12px] font-bold text-marka-green"
      >
        <TrendingUp className="h-3.5 w-3.5" />
        +32%
      </Fade>
    </>
  );
}

/* ---------------------------------------------------------------------- */

export function Workflow() {
  const { ref, visible, reducedMotion } = useWorkflowReveal();

  const dotTop = useTimedFlag(T.lineTop, visible, reducedMotion);
  const dotBottom = useTimedFlag(T.lineBottom, visible, reducedMotion);
  const dotMergeTop = useTimedFlag(T.mergeLine, visible, reducedMotion);
  const dotMergeBottom = useTimedFlag(T.mergeLine + 60, visible, reducedMotion);
  const dotToReativacao = useTimedFlag(T.lineToReativacao, visible, reducedMotion);
  const dotToResultados = useTimedFlag(T.lineToResultados, visible, reducedMotion);

  return (
    <section id="produto" className="relative overflow-hidden bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal delay={0} className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-marka-black sm:text-4xl">
            Veja o Marka IA trabalhando
          </h2>
        </Reveal>
        <Reveal delay={200} className="mx-auto max-w-2xl text-center">
          <p className="mt-3 text-balance text-marka-gray">
            Um fluxo contínuo: cada ação da IA se conecta à próxima e mantém seu negócio girando sozinho.
          </p>
        </Reveal>

        <div className="mt-14 overflow-x-auto overscroll-x-contain pb-4" style={{ scrollbarWidth: "thin" }}>
          <div ref={ref} className="relative mx-auto" style={{ width: TOTAL_W, height: TOTAL_H, minWidth: TOTAL_W }}>
            <svg
              className="pointer-events-none absolute inset-0"
              width={TOTAL_W}
              height={TOTAL_H}
              viewBox={`0 0 ${TOTAL_W} ${TOTAL_H}`}
              aria-hidden
            >
              <DrawPath
                d={PATH_TOP.d}
                length={PATH_TOP.length}
                delay={T.lineTop}
                duration={T.lineDuration}
                visible={visible}
                reducedMotion={reducedMotion}
              />
              <DrawPath
                d={PATH_BOTTOM.d}
                length={PATH_BOTTOM.length}
                delay={T.lineBottom}
                duration={T.lineDuration}
                visible={visible}
                reducedMotion={reducedMotion}
              />
              <DrawPath
                d={PATH_MERGE_TOP.d}
                length={PATH_MERGE_TOP.length}
                delay={T.mergeLine}
                duration={T.mergeDuration}
                visible={visible}
                reducedMotion={reducedMotion}
              />
              <DrawPath
                d={PATH_MERGE_BOTTOM.d}
                length={PATH_MERGE_BOTTOM.length}
                delay={T.mergeLine}
                duration={T.mergeDuration}
                visible={visible}
                reducedMotion={reducedMotion}
              />
              <DrawPath
                d={PATH_TO_REATIVACAO.d}
                length={PATH_TO_REATIVACAO.length}
                delay={T.lineToReativacao}
                duration={T.lineToReativacaoDuration}
                visible={visible}
                reducedMotion={reducedMotion}
              />
              <DrawPath
                d={PATH_TO_RESULTADOS.d}
                length={PATH_TO_RESULTADOS.length}
                delay={T.lineToResultados}
                duration={T.lineToResultadosDuration}
                visible={visible}
                reducedMotion={reducedMotion}
              />

              {!reducedMotion && (
                <>
                  <FlowDot d={PATH_TOP.d} start={dotTop} />
                  <FlowDot d={PATH_BOTTOM.d} start={dotBottom} />
                  <FlowDot d={PATH_MERGE_TOP.d} start={dotMergeTop} />
                  <FlowDot d={PATH_MERGE_BOTTOM.d} start={dotMergeBottom} />
                  <FlowDot d={PATH_TO_REATIVACAO.d} start={dotToReativacao} />
                  <FlowDot d={PATH_TO_RESULTADOS.d} start={dotToResultados} />
                </>
              )}
            </svg>

            <NodeCard pos={agenda} delay={T.agendaIn} visible={visible} reducedMotion={reducedMotion}>
              <AgendaContent visible={visible} reducedMotion={reducedMotion} />
            </NodeCard>

            <NodeCard pos={topDecision} delay={T.topCardIn} visible={visible} reducedMotion={reducedMotion}>
              <DecisionCard
                tone="confirm"
                title="Cliente confirmou"
                subtitle="Horário confirmado"
                detail="09:00 · amanhã"
                iconDelay={T.topCheckIn}
                visible={visible}
                reducedMotion={reducedMotion}
              />
            </NodeCard>

            <NodeCard pos={bottomDecision} delay={T.bottomCardIn} visible={visible} reducedMotion={reducedMotion}>
              <DecisionCard
                tone="cancel"
                title="Cliente desmarcou"
                subtitle="Horário liberado"
                iconDelay={T.bottomXIn}
                visible={visible}
                reducedMotion={reducedMotion}
              />
            </NodeCard>

            <NodeCard pos={lembrete} delay={T.lembreteIn} visible={visible} reducedMotion={reducedMotion}>
              <LembreteContent visible={visible} reducedMotion={reducedMotion} />
            </NodeCard>

            <NodeCard pos={reativacao} delay={T.reativacaoIn} visible={visible} reducedMotion={reducedMotion}>
              <ReativacaoContent visible={visible} reducedMotion={reducedMotion} />
            </NodeCard>

            <NodeCard pos={resultados} delay={T.resultadosIn} visible={visible} reducedMotion={reducedMotion}>
              <ResultadosContent visible={visible} reducedMotion={reducedMotion} />
            </NodeCard>
          </div>
        </div>
      </div>
    </section>
  );
}
