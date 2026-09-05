import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "marka.ia — Estabelecimento",
  description:
    "Sistema operacional do estabelecimento: agenda, clientes, CRM e inteligência.",
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
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
