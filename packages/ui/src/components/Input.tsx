import type { InputHTMLAttributes } from "react";
import { cn } from "../utils";

type InputState = "default" | "error" | "success";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visual validation state — purely presentational, does not affect behavior. */
  state?: InputState;
}

const stateClasses: Record<InputState, string> = {
  default:
    "border-black/10 focus:border-marka-green focus:shadow-glow",
  error: "border-red-300 bg-red-50/40 focus:border-red-500 focus:shadow-glow-error",
  success:
    "border-marka-green/50 focus:border-marka-green focus:shadow-glow-success",
};

export function Input({ className, state = "default", ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border bg-white px-3 text-sm transition-shadow",
        "text-marka-black outline-none placeholder:text-marka-gray",
        stateClasses[state],
        className
      )}
      {...props}
    />
  );
}
