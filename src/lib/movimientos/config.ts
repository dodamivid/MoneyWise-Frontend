import type { CatalogoKey } from "@/lib/catalogos/use-catalogo";

/**
 * Ingresos y egresos tienen casi la misma forma: tipo, monto, descripción y
 * fechas. Cambian la ruta, los catálogos y un campo secundario (procedencia en
 * ingresos, destino en egresos). Esta configuración describe esas diferencias
 * para reutilizar la misma pantalla en #7 y #8.
 */
export type MovimientoKind = "ingreso" | "egreso";

export interface MovimientoConfig {
  kind: MovimientoKind;
  /** Ruta del proxy, sin `/api/mw`. */
  path: string;
  /** Campo de id en la respuesta del backend. */
  idField: "ingresoId" | "egresoId";
  /** Campo secundario del cuerpo y de la respuesta. */
  secondaryField: "procedenciaId" | "destinoId";
  tipoCatalogo: CatalogoKey;
  secondaryCatalogo: CatalogoKey;
  texts: {
    singular: string;
    plural: string;
    title: string;
    description: string;
    create: string;
    tipoLabel: string;
    secondaryLabel: string;
    emptyTitle: string;
    emptyDescription: string;
  };
}

export const MOVIMIENTOS: Record<MovimientoKind, MovimientoConfig> = {
  ingreso: {
    kind: "ingreso",
    path: "/v1/ingresos",
    idField: "ingresoId",
    secondaryField: "procedenciaId",
    tipoCatalogo: "tipos-ingreso",
    secondaryCatalogo: "procedencias",
    texts: {
      singular: "ingreso",
      plural: "ingresos",
      title: "Ingresos",
      description: "Lo que entra a tu bolsillo.",
      create: "Registrar ingreso",
      tipoLabel: "Tipo de ingreso",
      secondaryLabel: "Procedencia",
      emptyTitle: "Aún no registras ingresos",
      emptyDescription: "Registra el primero para ver cómo va tu balance.",
    },
  },
  egreso: {
    kind: "egreso",
    path: "/v1/egresos",
    idField: "egresoId",
    secondaryField: "destinoId",
    tipoCatalogo: "tipos-egreso",
    secondaryCatalogo: "destinos",
    texts: {
      singular: "egreso",
      plural: "egresos",
      title: "Egresos",
      description: "Lo que sale de tu bolsillo.",
      create: "Registrar egreso",
      tipoLabel: "Tipo de egreso",
      secondaryLabel: "Destino",
      emptyTitle: "Aún no registras egresos",
      emptyDescription:
        "Registra el primero para saber en qué se va tu dinero.",
    },
  },
};

/** Fila normalizada: la misma forma para ingresos y egresos. */
export interface MovimientoRow {
  id: number;
  tipoId: number;
  secondaryId: number | null;
  monto: number;
  descripcion: string | null;
  fechaInicio: string;
  fechaFin: string | null;
}

export function toRow(
  raw: Record<string, unknown>,
  config: MovimientoConfig,
): MovimientoRow | null {
  const id = raw[config.idField];
  const tipoId = raw.tipoId;
  const monto = raw.monto;
  if (
    typeof id !== "number" ||
    typeof tipoId !== "number" ||
    typeof monto !== "number" ||
    typeof raw.fechaInicio !== "string"
  ) {
    return null;
  }
  const secondary = raw[config.secondaryField];
  return {
    id,
    tipoId,
    secondaryId: typeof secondary === "number" ? secondary : null,
    monto,
    descripcion: typeof raw.descripcion === "string" ? raw.descripcion : null,
    fechaInicio: raw.fechaInicio,
    fechaFin: typeof raw.fechaFin === "string" ? raw.fechaFin : null,
  };
}
