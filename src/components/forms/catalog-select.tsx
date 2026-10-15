"use client";

import { CircleAlert, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCatalogo, type CatalogoKey } from "@/lib/catalogos/use-catalogo";
import { cn } from "@/lib/utils";

interface CatalogSelectProps extends Omit<
  React.ComponentProps<"select">,
  "children"
> {
  id: string;
  catalogo: CatalogoKey;
  label: string;
  /** Texto de la opción vacía. */
  placeholder?: string;
  /** Error de validación del formulario. */
  error?: string;
}

/**
 * Select que se llena con un catálogo del backend.
 *
 * Es un `<select>` nativo a propósito: funciona con teclado y lectores de
 * pantalla sin trabajo extra, abre el selector del sistema en móvil y se
 * conecta directo a React Hook Form (`{...register("destinoId")}`).
 *
 * Maneja sus tres estados: cargando (deshabilitado), error (mensaje con
 * "Reintentar") y vacío (aviso en lugar de una lista sin opciones).
 */
export function CatalogSelect({
  id,
  catalogo,
  label,
  placeholder = "Elige una opción",
  error,
  className,
  disabled,
  ...props
}: CatalogSelectProps) {
  const {
    options,
    isLoading,
    isError,
    error: loadError,
    refetch,
  } = useCatalogo(catalogo);

  const errorId = error ? `${id}-error` : undefined;
  const statusId = `${id}-status`;
  const empty = !isLoading && !isError && options.length === 0;
  const describedBy =
    [errorId, isLoading || isError || empty ? statusId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        disabled={disabled || isLoading || isError}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-busy={isLoading || undefined}
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
          className,
        )}
        {...props}
      >
        <option value="">
          {isLoading ? "Cargando opciones…" : placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {isLoading ? (
        <p id={statusId} role="status" className="sr-only">
          Cargando opciones de {label.toLowerCase()}
        </p>
      ) : null}

      {isError ? (
        <div
          id={statusId}
          role="alert"
          className="flex flex-wrap items-center gap-2 text-sm text-destructive"
        >
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          <span>
            No pudimos cargar las opciones de {label.toLowerCase()}.{" "}
            {loadError?.mensaje}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      ) : null}

      {empty ? (
        <p id={statusId} className="text-sm text-muted-foreground">
          Aún no hay opciones de {label.toLowerCase()} disponibles.
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
