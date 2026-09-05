import { EmptyState as UiEmpty } from "@marka/ui/empty";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return <UiEmpty title={title} description={description} action={action} />;
}
