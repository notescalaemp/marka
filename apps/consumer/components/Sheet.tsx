"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-marka-black/40"
        aria-label="Fechar"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative max-h-[90vh] overflow-y-auto rounded-t-xl bg-marka-white p-5 shadow-xl">
        {children}
      </div>
    </div>
  );
}

export function SheetContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}

export function SheetTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("mb-4 text-lg font-semibold text-marka-black", className)}>
      {children}
    </h2>
  );
}
