import { cn } from "@/lib/utils";

interface LoadingProps {
  /** Texto que leen los lectores de pantalla. */
  label?: string;
  /** Cuántas filas de esqueleto mostrar. */
  rows?: number;
  className?: string;
}

/**
 * Estado de carga: esqueleto con la forma del contenido, no un spinner.
 * La animación se apaga con `prefers-reduced-motion`.
 */
export function Loading({
  label = "Cargando…",
  rows = 4,
  className,
}: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("grid gap-3", className)}
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-12 rounded-lg bg-muted motion-safe:animate-pulse"
        />
      ))}
    </div>
  );
}
