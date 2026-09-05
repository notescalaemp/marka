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
      <div className="rounded-lg border border-dashed border-marka-graphite/20 bg-marka-white px-6 py-12 text-center">
        <h3 className="text-base font-medium text-marka-black">Em construção</h3>
        <p className="mt-2 max-w-sm text-sm text-marka-gray">
          {title} faz parte do roadmap do backoffice. A estrutura de rota e
          permissões já estão preparadas.
        </p>
      </div>
    </div>
  );
}
