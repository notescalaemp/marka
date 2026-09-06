"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthVisual } from "@/components/auth/AuthVisual";
import { AuthToggle } from "@/components/auth/AuthToggle";

type Mode = "login" | "register";

// The slots start crossing the instant you click; the actual route (and
// therefore the form fields) only swaps once they've mostly finished
// crossing, so the DOM never swaps mid-flight — the block just arrives,
// then its content settles.
const NAV_DELAY_MS = 620;
const DEPTH_MS = 480;

function pathToMode(pathname: string): Mode {
  return pathname.startsWith("/register") ? "register" : "login";
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function isDesktopViewport() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(() => pathToMode(pathname));
  const [depth, setDepth] = useState(false);
  const navTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const depthTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Source of truth once navigation actually lands (back/forward, deep links).
  useEffect(() => {
    setMode(pathToMode(pathname));
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (navTimeout.current) clearTimeout(navTimeout.current);
      if (depthTimeout.current) clearTimeout(depthTimeout.current);
    };
  }, []);

  const handleSelect = useCallback(
    (target: Mode) => {
      if (target === mode) return;
      const href = target === "login" ? "/login" : "/register";

      if (navTimeout.current) clearTimeout(navTimeout.current);
      if (depthTimeout.current) clearTimeout(depthTimeout.current);

      // Flip immediately so the slots/toggle start moving right away.
      setMode(target);

      const reduced = prefersReducedMotion();
      const delay = !reduced && isDesktopViewport() ? NAV_DELAY_MS : 0;

      if (delay > 0) {
        setDepth(true);
        depthTimeout.current = setTimeout(() => setDepth(false), DEPTH_MS);
      }
      navTimeout.current = setTimeout(() => router.push(href), delay);
    },
    [mode, router]
  );

  const transitioning = depth ? "" : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-marka-off px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-glass lg:p-14 xl:p-16">
        {/* auth-slots is a stacked flex column on mobile (image, then form —
            no lateral movement) and becomes a 2-column grid at lg+, where the
            swap happens as a paint-only transform so this container's height
            always comes from normal layout, never from the animation. */}
        <div className="auth-slots">
          <div
            data-mode={mode}
            data-transitioning={transitioning}
            className="auth-slot auth-slot-image px-5 pt-5 sm:px-8 sm:pt-8 lg:p-0"
          >
            <div className="mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-3xl shadow-card sm:max-w-[300px] lg:max-w-[420px] lg:rounded-[1.75rem]">
              <AuthVisual />
            </div>
          </div>
          <div
            data-mode={mode}
            data-transitioning={transitioning}
            className="auth-slot auth-slot-form px-6 pb-8 pt-6 sm:px-10 sm:pb-10 lg:p-0"
          >
            <div className="mx-auto w-full max-w-sm">
              <AuthToggle mode={mode} onSelect={handleSelect} />
              <div key={pathname} className="mt-7 auth-content-settle lg:mt-8">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
