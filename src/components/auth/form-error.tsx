import { TriangleAlert } from "lucide-react";

interface FormErrorProps {
  mensaje: string;
  traceId?: string;
}

/** Aviso general de un formulario (errores del servidor). */
export function FormError({ mensaje, traceId }: FormErrorProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-foreground"
    >
      <TriangleAlert
        className="mt-0.5 size-4 shrink-0 text-destructive"
        aria-hidden="true"
      />
      <div className="grid gap-1">
        <p>{mensaje}</p>
        {traceId ? (
          <p className="text-xs text-muted-foreground">
            Código de referencia: {traceId}
          </p>
        ) : null}
      </div>
    </div>
  );
}
