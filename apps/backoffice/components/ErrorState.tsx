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
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-marka-graphite/20 bg-marka-white px-6 py-10 text-center",
        className
      )}
    >
      <h3 className="text-base font-medium text-marka-black">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-marka-gray">{description}</p>
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
