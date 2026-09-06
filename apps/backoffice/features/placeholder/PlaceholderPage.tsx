import { Hammer } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-black/10 bg-marka-off/60 px-6 py-14 text-center">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-marka-gray shadow-card">
          <Hammer className="h-5 w-5" />
        </span>
        <h3 className="mt-3 text-base font-medium text-marka-black">Em construção</h3>
        <p className="mt-1.5 max-w-sm text-sm text-marka-gray">
          {title} faz parte do roadmap do backoffice. A estrutura de rota e
          permissões já estão preparadas.
        </p>
      </div>
    </div>
  );
}
