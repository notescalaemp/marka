"use client";

import { cn } from "@marka/ui/cn";

const PANEL_EASE = "cubic-bezier(0.76, 0, 0.24, 1)";

export function AuthToggle({
  mode,
  onSelect,
}: {
  mode: "login" | "register";
  onSelect: (mode: "login" | "register") => void;
}) {
  return (
    <div className="relative flex rounded-full border border-black/10 bg-marka-off p-1">
      <span
        className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-marka-gradient shadow-card-hover transition-transform"
        style={{
          transform: mode === "register" ? "translateX(100%)" : "translateX(0)",
          transitionDuration: "900ms",
          transitionTimingFunction: PANEL_EASE,
        }}
      />
      <button
        type="button"
        onClick={() => onSelect("login")}
        aria-pressed={mode === "login"}
        className={cn(
          "relative z-10 flex-1 rounded-full py-2 text-center text-sm font-medium transition-colors duration-300",
          mode === "login" ? "text-white" : "text-marka-slate hover:text-marka-navy"
        )}
      >
        Entrar
      </button>
      <button
        type="button"
        onClick={() => onSelect("register")}
        aria-pressed={mode === "register"}
        className={cn(
          "relative z-10 flex-1 rounded-full py-2 text-center text-sm font-medium transition-colors duration-300",
          mode === "register" ? "text-white" : "text-marka-slate hover:text-marka-navy"
        )}
      >
        Criar conta
      </button>
    </div>
  );
}
