import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
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

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
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
      {children}
    </button>
  );
}
