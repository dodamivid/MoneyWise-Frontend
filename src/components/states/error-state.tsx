import { RefreshCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  /** Qué no se pudo hacer: "No pudimos cargar tus egresos". */
  title?: string;
  /** Qué pasó y cómo resolverlo. Suele venir de `ApiError.mensaje`. */
  mensaje: string;
  /** Referencia para soporte (`ApiError.traceId`). */
  traceId?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Estado de error: dice qué pasó, cómo resolverlo y deja reintentar.
 * Usa `role="alert"` para que los lectores de pantalla lo anuncien.
 */
export function ErrorState({
  title = "No pudimos cargar esta información",
  mensaje,
  traceId,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center",
        className,
      )}
    >
      <TriangleAlert className="size-8 text-destructive" aria-hidden="true" />
      <div className="grid gap-1">
        <p className="text-base font-semibold">{title}</p>
        <p className="max-w-prose text-sm text-muted-foreground">{mensaje}</p>
        {traceId ? (
          <p className="text-xs text-muted-foreground">
            Código de referencia: {traceId}
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}
