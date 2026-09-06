import type { HTMLAttributes } from "react";
import { cn } from "../utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {}

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        "bg-marka-off text-marka-graphite",
        className
      )}
      {...props}
    />
  );
}
