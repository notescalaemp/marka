import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { NotFoundScene } from "@/components/NotFoundScene";

export const metadata: Metadata = {
  title: "Página não encontrada — marka.ia",
  description: "Essa rota saiu do fluxo. Volte para o início do Marka IA.",
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 py-20 sm:px-6">
      <div className="aura left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 bg-marka-green/10" aria-hidden />
      <div className="aura -right-16 bottom-10 h-72 w-72 bg-marka-green-mid/10" aria-hidden />

      <BrandLogo className="absolute left-4 top-4 sm:left-6 sm:top-6" />

      <div className="relative mx-auto w-full max-w-6xl">
        <NotFoundScene />

        <div className="relative mx-auto mt-6 max-w-xl text-center sm:mt-10">
          <h1
            className="animate-fade-in-up text-balance text-2xl font-semibold tracking-tight text-marka-black sm:text-3xl"
            style={{ animationDelay: "900ms" }}
          >
            Essa rota saiu do fluxo.
          </h1>
          <p
            className="animate-fade-in-up mt-3 text-balance text-marka-gray"
            style={{ animationDelay: "980ms" }}
          >
            Parece que essa página tomou um caminho errado. Vamos colocar você de volta no lugar certo.
          </p>
          <div
            className="animate-fade-in-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "1060ms" }}
          >
            <Link href="/" className="btn-primary h-12 px-7 text-sm sm:text-base">
              Voltar para o início
            </Link>
            <Link href="/#produto" className="btn-ghost h-12 px-7 text-sm sm:text-base">
              Conhecer o Marka IA
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
