import { Inbox } from "lucide-react";
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
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-marka-off/60 px-6 py-12 text-center",
        className
      )}
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-marka-gray shadow-card">
        <Inbox className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-base font-medium text-marka-black">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-marka-gray">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
