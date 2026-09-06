import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

const COLUMNS = [
  {
    title: "Produto",
    links: [
      { label: "Agenda Inteligente", href: "#produto" },
      { label: "Lembretes Automáticos", href: "#produto" },
      { label: "Clientes", href: "#produto" },
      { label: "Financeiro", href: "#produto" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre", href: "#home" },
      { label: "Setores atendidos", href: "#setores" },
      { label: "Números", href: "#numeros" },
      { label: "Agendar demonstração", href: "#demo" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Termos de uso", href: "#" },
      { label: "Política de privacidade", href: "#" },
      { label: "Contrato de assinatura", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-marka-line bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <BrandLogo href="#home" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-marka-gray">
              O sistema de inteligência artificial que organiza a agenda, os clientes e o crescimento de negócios locais.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-marka-black">{column.title}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-marka-gray transition-colors hover:text-marka-black">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-marka-line pt-8 text-xs text-marka-gray sm:flex-row">
          <p>© {new Date().getFullYear()} Marka. Todos os direitos reservados.</p>
          <Link
            href="/status"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-marka-line bg-white px-3.5 text-xs font-medium text-marka-black shadow-xs transition-colors hover:border-marka-green/40 hover:text-marka-green"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-marka-green" aria-hidden />
            Todos os serviços onlines
          </Link>
        </div>
      </div>
    </footer>
  );
}
