import { CircleAlert } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TextFieldProps extends React.ComponentProps<typeof Input> {
  id: string;
  label: string;
  /** Ayuda estática que se lee junto con el campo. */
  hint?: string;
  error?: string;
}

/**
 * Campo de formulario accesible: etiqueta visible, ayuda y error enlazados con
 * `aria-describedby`. El error lleva ícono y texto, nunca solo color.
 */
export function TextField({
  id,
  label,
  hint,
  error,
  ...props
}: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
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
