import { cn } from "@/lib/cn";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-marka-graphite/20 bg-marka-off/50 px-6 py-10 text-center",
        className
      )}
    >
      <h3 className="text-base font-medium text-marka-black">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-marka-gray">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
