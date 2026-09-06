"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Calendar, Users, Bell, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * "404" rendered as a physical object: a pale gradient front face plus a
 * 14-layer diagonal text-shadow stack that steps from near-white/green down
 * to near-black, faking a beveled extrusion without a 3D engine.
 */
const EXTRUSION_LAYERS = [
  "#E3F3EC",
  "#CFEBDF",
  "#BFE4D6",
  "#A9DCC9",
  "#93D3BC",
  "#7ECAB0",
  "#6AC0A2",
  "#56B898",
  "#3FA286",
  "#309577",
  "#276F5C",
  "#1E5347",
  "#163A33",
  "#0E172A",
];
const EXTRUSION_SHADOW = EXTRUSION_LAYERS.map(
  (color, i) => `${(i + 1) * 1.4}px ${(i + 1) * 1.4}px 0 ${color}`
).join(", ");

const BASE_ROTATE_X = 5;
const BASE_ROTATE_Y = -6;
const MAX_MOUSE_DEG = 4;

type NodeKey = "agenda" | "clientes" | "lembretes";

const NODES: Record<
  NodeKey,
  {
    label: string;
    icon: LucideIcon;
    left: string;
    top: string;
    depth: number;
    connected: boolean;
    floatDelay: string;
    enterDelay: number;
  }
> = {
  agenda: {
    label: "Agenda",
    icon: Calendar,
    left: "14%",
    top: "16%",
    depth: 70,
    connected: true,
    floatDelay: "0s",
    enterDelay: 260,
  },
  clientes: {
    label: "Clientes",
    icon: Users,
    left: "16%",
    top: "76%",
    depth: -30,
    connected: true,
    floatDelay: "1.4s",
    enterDelay: 380,
  },
  lembretes: {
    label: "Lembretes",
    icon: Bell,
    left: "83%",
    top: "20%",
    depth: 40,
    connected: false,
    floatDelay: "0.7s",
    enterDelay: 500,
  },
};

const PATHS: Record<"agenda" | "clientes", string> = {
  agenda: "M56,70 Q172,104 190,215",
  clientes: "M64,334 Q108,296 190,232",
};
const BROKEN_PATH = "M332,88 Q290,120 255,150";

export function NotFoundScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hovered, setHovered] = useState<NodeKey | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setVisible(true));
      rafRef.current = raf2;
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!supportsHover) return;
    const scene = sceneRef.current;
    const stage = stageRef.current;
    if (!scene || !stage) return;

    let pending = false;

    const handleMove = (e: MouseEvent) => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const rect = scene.getBoundingClientRect();
        const dx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const dy = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        const rotY = BASE_ROTATE_Y + dx * MAX_MOUSE_DEG;
        const rotX = BASE_ROTATE_X - dy * MAX_MOUSE_DEG;
        stage.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      });
    };
    const handleLeave = () => {
      stage.style.transform = `rotateX(${BASE_ROTATE_X}deg) rotateY(${BASE_ROTATE_Y}deg)`;
    };

    scene.addEventListener("mousemove", handleMove);
    scene.addEventListener("mouseleave", handleLeave);
    return () => {
      scene.removeEventListener("mousemove", handleMove);
      scene.removeEventListener("mouseleave", handleLeave);
    };
  }, [reducedMotion]);

  const delay = (ms: number) => (reducedMotion ? "0ms" : `${ms}ms`);

  const pathStyle = (key: "agenda" | "clientes", enterDelay: number): React.CSSProperties => ({
    strokeDasharray: 1,
    strokeDashoffset: visible ? 0 : 1,
    strokeWidth: hovered === key ? 3 : 2,
    strokeOpacity: hovered && hovered !== key ? 0.35 : 1,
    transition:
      "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1), stroke-width 0.25s ease, stroke-opacity 0.25s ease",
    transitionDelay: delay(enterDelay),
  });

  return (
    <div
      ref={sceneRef}
      role="img"
      aria-label="Ilustração de uma rota desconectada de um fluxo de trabalho, com o número 404 no centro"
      className="relative mx-auto w-full max-w-[380px] sm:max-w-[560px]"
      style={{ perspective: "1400px" }}
    >
      <div
        ref={stageRef}
        className="relative aspect-[400/440] w-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${BASE_ROTATE_X}deg) rotateY(${BASE_ROTATE_Y}deg)`,
        }}
      >
        {/* connections */}
        <svg
          viewBox="0 0 400 440"
          className="absolute inset-0 h-full w-full"
          style={{ transform: "translateZ(10px)" }}
          aria-hidden
        >
          <defs>
            <linearGradient id="nf-line-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#56B898" />
              <stop offset="100%" stopColor="#309577" />
            </linearGradient>
            <linearGradient id="nf-broken-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#728096" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#728096" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            id="nf-path-agenda"
            d={PATHS.agenda}
            fill="none"
            stroke="url(#nf-line-grad)"
            pathLength={1}
            style={pathStyle("agenda", 620)}
          />
          <path
            id="nf-path-clientes"
            d={PATHS.clientes}
            fill="none"
            stroke="url(#nf-line-grad)"
            pathLength={1}
            style={pathStyle("clientes", 700)}
          />
          <path
            d={BROKEN_PATH}
            fill="none"
            stroke="url(#nf-broken-grad)"
            strokeWidth={2}
            strokeDasharray="5 6"
            style={{
              opacity: visible ? 1 : 0,
              transition: "opacity 0.9s cubic-bezier(0.16,1,0.3,1)",
              transitionDelay: delay(780),
            }}
          />

          {!reducedMotion && visible && (
            <>
              <circle r="2.4" fill="#EAFBF3">
                <animateMotion dur="6.5s" begin="1.4s" repeatCount="indefinite">
                  <mpath href="#nf-path-agenda" />
                </animateMotion>
              </circle>
              <circle r="2.4" fill="#EAFBF3">
                <animateMotion dur="7.2s" begin="2s" repeatCount="indefinite">
                  <mpath href="#nf-path-clientes" />
                </animateMotion>
              </circle>
            </>
          )}
        </svg>

        {/* 404 numeral */}
        <div
          className="absolute left-1/2 top-[44%]"
          style={{ transform: "translate(-50%, -50%) translateZ(0px)" }}
        >
          <div className={cn(!reducedMotion && "animate-float-subtle")}>
            <div
              className={cn(
                "transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                visible ? "scale-100 opacity-100" : "scale-90 opacity-0"
              )}
              style={{ transitionDelay: delay(60) }}
            >
              <span
                aria-hidden
                className="block select-none text-[clamp(4.5rem,15vw,9.5rem)] font-extrabold leading-none tracking-tight"
                style={{
                  backgroundImage: "linear-gradient(180deg, #FFFFFF 0%, #F4FBF8 55%, #DFF0E8 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: EXTRUSION_SHADOW,
                  filter:
                    "drop-shadow(0 26px 34px rgba(14,23,42,0.16)) drop-shadow(0 6px 14px rgba(48,149,119,0.12))",
                }}
              >
                404
              </span>
            </div>
          </div>
          <span className="sr-only">Erro 404 — página não encontrada</span>
        </div>

        {/* nodes */}
        {(Object.keys(NODES) as NodeKey[]).map((key) => {
          const node = NODES[key];
          const Icon = node.icon;
          return (
            <div
              key={key}
              className="absolute"
              style={{
                left: node.left,
                top: node.top,
                transform: `translate(-50%, -50%) translateZ(${node.depth}px)`,
              }}
            >
              <div
                className={cn(!reducedMotion && "animate-float")}
                style={{ animationDelay: reducedMotion ? undefined : node.floatDelay }}
              >
                <div
                  className={cn(
                    "transition-[opacity,transform] duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                    visible ? "scale-100 opacity-100" : "scale-90 opacity-0"
                  )}
                  style={{ transitionDelay: delay(node.enterDelay) }}
                >
                  <div
                    onMouseEnter={() => setHovered(key)}
                    onMouseLeave={() => setHovered((h) => (h === key ? null : h))}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl border bg-white/95 px-3 py-2.5 shadow-card transition-all duration-300 ease-out",
                      node.connected ? "border-marka-line" : "border-marka-line/70 opacity-85",
                      hovered === key && "-translate-y-1 border-marka-green/40 shadow-card-hover"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        node.connected ? "bg-marka-green-tint text-marka-green" : "bg-marka-off text-marka-gray"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="whitespace-nowrap text-xs font-semibold text-marka-black">{node.label}</span>
                    {!node.connected && <span className="ml-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marka-gray/50" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* decorative depth elements — hidden on mobile to keep the composition light */}
        <div
          className="absolute hidden sm:block"
          style={{ left: "87%", top: "62%", transform: "translate(-50%, -50%) translateZ(-70px)" }}
        >
          <div className={cn(!reducedMotion && "animate-float-delay")}>
            <div
              className={cn(
                "scale-75 transition-[opacity,transform] duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                visible ? "opacity-70" : "opacity-0"
              )}
              style={{ transitionDelay: delay(150) }}
            >
              <div className="flex items-center gap-1 rounded-full border border-marka-line bg-white/90 px-2.5 py-1.5 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-marka-green/50" />
                <span className="h-1.5 w-1.5 rounded-full bg-marka-green/30" />
                <span className="h-1.5 w-1.5 rounded-full bg-marka-green/20" />
              </div>
            </div>
          </div>
        </div>
        <div
          className="absolute hidden sm:block"
          style={{ left: "44%", top: "88%", transform: "translate(-50%, -50%) translateZ(45px)" }}
        >
          <div className={cn(!reducedMotion && "animate-float")} style={{ animationDelay: "0.4s" }}>
            <div
              className={cn(
                "transition-[opacity,transform] duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                visible ? "scale-100 opacity-100" : "scale-90 opacity-0"
              )}
              style={{ transitionDelay: delay(600) }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-marka-line bg-white/95 text-marka-green shadow-xs">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
