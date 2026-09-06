import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "marka.ia — A IA que organiza agenda, clientes e crescimento",
  description:
    "O Marka IA organiza a agenda, cuida dos clientes e impulsiona o crescimento do seu estabelecimento — barbearias, salões, clínicas e profissionais autônomos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
