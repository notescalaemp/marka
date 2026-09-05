import type { ReactNode } from "react";
import { cn } from "../utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-marka-graphite/20",
        "bg-marka-off-white/50 px-6 py-12 text-center",
        className
      )}
    >
      <h3 className="text-base font-medium text-marka-black">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-marka-gray">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
