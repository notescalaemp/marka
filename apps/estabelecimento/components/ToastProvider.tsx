"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@marka/ui/cn";

type ToastContextValue = {
  show: (message: string) => void;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

  useEffect(() => {
    const onShow = (message: string) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2800);
    };

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail) onShow(detail);
    };
    window.addEventListener("marka-toast", handler as EventListener);

    return () => {
      window.removeEventListener("marka-toast", handler as EventListener);
    };
  }, []);

  return (
    <>
      {children}
      <div
        className={cn(
          "fixed bottom-20 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4"
        )}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-md bg-marka-black px-4 py-3 text-sm text-marka-white shadow-lg"
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}

export function useToast(): ToastContextValue {
  return {
    show: (message: string) => {
      if (typeof window === "undefined") return;
      window.dispatchEvent(new CustomEvent("marka-toast", { detail: message }));
    },
  };
}
