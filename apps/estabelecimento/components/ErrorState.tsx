"use client";

import { Button } from "@marka/ui/button";
import { EmptyState } from "./EmptyState";

export function ErrorState({
  title = "Algo deu errado",
  description = "Não foi possível carregar esta página. Tente novamente.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        ) : null
      }
    />
  );
}
