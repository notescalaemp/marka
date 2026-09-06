import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils";

type StatusTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

const tones: Record<StatusTone, string> = {
  default: "bg-marka-off text-marka-graphite",
  success: "bg-marka-green-soft text-marka-green-dark",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
  info: "bg-sky-50 text-sky-800",
  muted: "bg-marka-graphite/5 text-marka-gray",
};

const dots: Record<StatusTone, string> = {
  default: "bg-marka-gray",
  success: "bg-marka-green",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
  muted: "bg-marka-gray/60",
};

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  children: ReactNode;
}

export function StatusBadge({
  tone = "default",
  children,
  className,
  ...props
}: StatusBadgeProps) {
  const pulsing = tone === "warning" || tone === "danger";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        tones[tone],
        className
      )}
      {...props}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", dots[tone], pulsing && "animate-pulse-soft")}
      />
      {children}
    </span>
  );
}
