"use client";

import { useState } from "react";

import { CatalogSelect } from "@/components/forms/catalog-select";
import { CATALOGOS, type CatalogoKey } from "@/lib/catalogos/use-catalogo";

const LABELS: Record<CatalogoKey, string> = {
  destinos: "Destino",
  procedencias: "Procedencia",
  "tipos-ingreso": "Tipo de ingreso",
  "tipos-egreso": "Tipo de egreso",
  frecuencias: "Frecuencia",
};

/** Formulario de prueba: confirma que los cinco catálogos cargan y se eligen. */
export function CatalogosPrueba() {
  const [values, setValues] = useState<Partial<Record<CatalogoKey, string>>>(
    {},
  );
  const keys = Object.keys(CATALOGOS) as CatalogoKey[];

  return (
    <div className="grid max-w-md gap-4">
      {keys.map((key) => (
        <CatalogSelect
          key={key}
          id={`prueba-${key}`}
          catalogo={key}
          label={LABELS[key]}
          value={values[key] ?? ""}
          onChange={(event) =>
            setValues((current) => ({ ...current, [key]: event.target.value }))
          }
        />
      ))}
      <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
        {JSON.stringify(values, null, 2)}
      </pre>
    </div>
  );
}
