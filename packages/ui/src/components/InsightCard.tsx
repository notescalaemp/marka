import type { ReactNode } from "react";
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
        "rounded-lg border border-marka-graphite/10 bg-marka-off p-4",
        className
      )}
    >
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
  );
}
