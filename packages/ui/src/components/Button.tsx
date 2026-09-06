"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-marka-gradient text-white shadow-[0_1px_2px_rgba(11,11,11,0.06),0_10px_24px_-10px_rgba(48,149,119,0.55)] hover:brightness-[1.04] active:brightness-[0.98]",
  secondary:
    "bg-white text-marka-black border border-black/10 hover:border-marka-green/40 hover:bg-marka-green-soft/60",
  ghost: "text-marka-graphite hover:bg-marka-off",
  outline:
    "border border-black/15 bg-transparent text-marka-black hover:border-marka-green hover:text-marka-green-dark",
  destructive:
    "bg-red-600 text-white shadow-[0_1px_2px_rgba(11,11,11,0.06),0_10px_24px_-10px_rgba(220,38,38,0.55)] hover:bg-red-700",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-3.5 w-3.5 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M22 12a10 10 0 0 0-10-10v3.5A6.5 6.5 0 0 1 18.5 12H22Z"
      />
    </svg>
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marka-green/40 focus-visible:ring-offset-1",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
