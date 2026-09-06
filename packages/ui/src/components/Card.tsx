import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Adds hover lift + shadow for clickable cards (e.g. wrapped in a Link). */
  interactive?: boolean;
}

export function Card({ className, children, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.06] bg-white shadow-card",
        interactive &&
          "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card-hover",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
