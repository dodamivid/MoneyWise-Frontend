import Link from "next/link";
import { Inbox, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyAction {
  label: string;
  /** Si se pasa `href` se renderiza un enlace; si no, un botón con `onClick`. */
  href?: string;
  onClick?: () => void;
}

interface EmptyProps {
  title: string;
  /** Por qué está vacío y qué hacer. */
  description?: string;
  action?: EmptyAction;
  icon?: LucideIcon;
  className?: string;
}

/**
 * Estado vacío: explica por qué no hay nada y propone una acción.
 * Ejemplo: "Aún no registras ingresos" + "Registrar ingreso".
 */
export function Empty({
  title,
  description,
  action,
  icon: Icon = Inbox,
  className,
}: EmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center",
        className,
      )}
    >
      <Icon className="size-8 text-muted-foreground" aria-hidden="true" />
      <div className="grid gap-1">
        <p className="text-base font-semibold">{title}</p>
        {description ? (
          <p className="max-w-prose text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        action.href ? (
          <Button nativeButton={false} render={<Link href={action.href} />}>
            {action.label}
          </Button>
        ) : (
          <Button onClick={action.onClick}>{action.label}</Button>
        )
      ) : null}
    </div>
  );
}
