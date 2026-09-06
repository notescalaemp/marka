"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Produto", href: "#produto" },
  { label: "Números", href: "#numeros" },
  { label: "Setores", href: "#setores" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const light = !scrolled;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 sm:px-6 lg:px-10">
      <div
        className={cn(
          "relative mx-auto flex max-w-6xl items-center justify-between overflow-hidden rounded-2xl px-4 py-2.5 transition-all duration-500 sm:px-5",
          light ? "mt-6 border border-transparent bg-transparent sm:mt-8 lg:mt-10" : "mt-3 border border-transparent bg-white shadow-xs"
        )}
      >
        <BrandLogo tone={light ? "light" : "dark"} href="#home" priority />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-300",
                light
                  ? "text-white/85 hover:bg-white/10 hover:text-white"
                  : "text-marka-gray hover:bg-marka-off hover:text-marka-black"
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href="#demo"
            className={cn(
              "h-10 px-5 text-sm",
              light ? "btn-hero-primary" : "btn-primary"
            )}
          >
            Agendar demonstração
          </a>
        </div>

        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-300 md:hidden",
            light ? "text-white hover:bg-white/10" : "text-marka-black hover:bg-marka-off"
          )}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-marka-green transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
          aria-hidden
        />
      </div>

      {open && (
        <div className="mt-2 rounded-2xl border border-marka-line bg-white p-4 shadow-panel md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-marka-black hover:bg-marka-off"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-marka-line pt-3">
            <a href="#demo" onClick={() => setOpen(false)} className="btn-primary h-10 text-sm">
              Agendar demonstração
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
