import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-marka-graphite/20 bg-marka-white px-3 text-sm",
        "text-marka-black outline-none placeholder:text-marka-gray",
        "focus:border-marka-black focus:ring-1 focus:ring-marka-black",
        className
      )}
      {...props}
    />
  );
}
