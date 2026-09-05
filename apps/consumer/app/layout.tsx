import type { Metadata } from "next";
import Link from "next/link";
import { StoreProvider } from "@/lib/store";
import { BottomNav } from "@/components/BottomNav";
import { MarkaMark } from "@/components/MarkaMark";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "marka.ia — Consumer",
  description:
    "Descubra, encontre e agende profissionais de beleza com marka.ia.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <StoreProvider>
          <ToastProvider>
            <div className="mx-auto flex min-h-screen max-w-3xl flex-col">
              <header className="sticky top-0 z-30 border-b border-marka-graphite/10 bg-marka-white px-4 py-3 md:px-0">
                <div className="flex items-center justify-between">
                  <MarkaMark className="text-sm" />
                  <nav className="hidden items-center gap-4 text-sm md:flex">
                    <Link href="/">Início</Link>
                    <Link href="/buscar">Buscar</Link>
                    <Link href="/agendamentos">Agendamentos</Link>
                    <Link href="/favoritos">Favoritos</Link>
                    <Link href="/perfil">Perfil</Link>
                  </nav>
                </div>
              </header>
              <main className="flex-1 px-4 py-6 pb-28 md:pb-8">
                {children}
              </main>
              <BottomNav />
            </div>
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
