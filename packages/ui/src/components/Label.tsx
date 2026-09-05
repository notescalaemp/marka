import type { LabelHTMLAttributes } from "react";
import { cn } from "../utils";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "text-sm font-medium text-marka-graphite",
        className
      )}
      {...props}
    />
  );
}
