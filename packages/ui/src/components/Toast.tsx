"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../utils";

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

  useEffect(() => {
    // no-op: keep toast list as local state; no createContext to avoid SSR issues
  }, []);

  return (
    <>
      {children}
      <div className="fixed bottom-20 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-md bg-marka-black px-4 py-3 text-sm text-marka-white shadow-lg"
            )}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}

export function useToast() {
  return {
    show: (message: string) => {
      /* toast UI deferred */
      if (typeof window === "undefined") return;
      window.dispatchEvent(new CustomEvent("marka-toast", { detail: message }));
    },
  };
}
