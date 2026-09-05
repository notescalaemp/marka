import type { ReactNode } from "react";
import { cn } from "../utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-b border-marka-graphite/10 pb-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-marka-black">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-marka-gray">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
