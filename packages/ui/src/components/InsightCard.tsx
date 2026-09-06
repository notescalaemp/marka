import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "../utils";
import { Button } from "./Button";

interface InsightCardProps {
  title: string;
  explanation: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  className?: string;
  children?: ReactNode;
}

export function InsightCard({
  title,
  explanation,
  actionLabel,
  onAction,
  className,
  children,
}: InsightCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-marka-green/15 bg-marka-green-soft p-4",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-marka-gradient opacity-10" />
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-marka-green-dark shadow-card">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-marka-black">{title}</p>
          <p className="mt-1 text-sm text-marka-graphite">{explanation}</p>
          {children}
          {actionLabel ? (
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={onAction}>
                {actionLabel}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
