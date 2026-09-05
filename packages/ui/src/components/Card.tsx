import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-marka-graphite/10 bg-marka-white",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
