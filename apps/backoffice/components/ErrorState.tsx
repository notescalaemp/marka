import { AlertOctagon } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Não foi possível carregar",
  description = "Tente novamente. Se o problema persistir, verifique a API.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/40 px-6 py-12 text-center",
        className
      )}
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-red-600 shadow-card">
        <AlertOctagon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-base font-medium text-marka-black">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-marka-gray">{description}</p>
      {onRetry ? (
        <div className="mt-4">
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      ) : null}
    </div>
  );
}
