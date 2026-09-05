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
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-800",
  info: "bg-sky-50 text-sky-800",
  muted: "bg-marka-graphite/5 text-marka-gray",
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
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
