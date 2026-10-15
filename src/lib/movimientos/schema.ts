import { z } from "zod";

import { dateInputToIso } from "@/lib/format";
import type { MovimientoConfig, MovimientoRow } from "./config";

/**
 * Esquema del formulario de ingresos y egresos. Todo se maneja como texto (es
 * lo que entregan los inputs) y se convierte al armar el cuerpo.
 */

/** "1,234.50" → 1234.5. Devuelve NaN si no es un número. */
export function parseMonto(value: string): number {
  const clean = value.trim().replace(/[,\s$]/g, "");
  if (clean === "" || !/^\d+(\.\d+)?$/.test(clean)) return Number.NaN;
  return Number(clean);
}

export const movimientoSchema = z
  .object({
    tipoId: z.string().min(1, "Elige un tipo."),
    secondaryId: z.string(),
    monto: z
      .string()
      .trim()
      .min(1, "Escribe el monto.")
      .refine(
        (v) => !Number.isNaN(parseMonto(v)),
        "Escribe solo números, por ejemplo 1250.50.",
      )
      .refine((v) => parseMonto(v) > 0, "El monto debe ser mayor a 0.")
      .refine(
        (v) => Number(parseMonto(v).toFixed(2)) === parseMonto(v),
        "El monto puede tener máximo 2 decimales.",
      ),
    descripcion: z
      .string()
      .max(255, "La descripción no puede pasar de 255 caracteres."),
    fechaInicio: z
      .string()
      .min(1, "Elige la fecha.")
      .refine((v) => dateInputToIso(v) !== null, "Elige una fecha válida."),
    fechaFin: z.string(),
  })
  .refine((v) => v.fechaFin === "" || dateInputToIso(v.fechaFin) !== null, {
    path: ["fechaFin"],
    message: "Elige una fecha válida.",
  })
  .refine((v) => v.fechaFin === "" || v.fechaFin >= v.fechaInicio, {
    path: ["fechaFin"],
    message: "La fecha final no puede ser anterior a la inicial.",
  });

export type MovimientoFormValues = z.infer<typeof movimientoSchema>;

/** Campos del formulario a los que se puede asociar un error del backend. */
export const FORM_FIELDS = [
  "tipoId",
  "secondaryId",
  "monto",
  "descripcion",
  "fechaInicio",
  "fechaFin",
] as const;
export type FormField = (typeof FORM_FIELDS)[number];

/** Nombre de campo del backend → campo del formulario. */
export function backendFieldToForm(
  field: string,
  config: MovimientoConfig,
): FormField | null {
  if (field === config.secondaryField) return "secondaryId";
  return (FORM_FIELDS as readonly string[]).includes(field)
    ? (field as FormField)
    : null;
}

export function emptyValues(today: string): MovimientoFormValues {
  return {
    tipoId: "",
    secondaryId: "",
    monto: "",
    descripcion: "",
    fechaInicio: today,
    fechaFin: "",
  };
}

export function rowToValues(
  row: MovimientoRow,
  toDateInput: (iso: string) => string,
): MovimientoFormValues {
  return {
    tipoId: String(row.tipoId),
    secondaryId: row.secondaryId === null ? "" : String(row.secondaryId),
    monto: String(row.monto),
    descripcion: row.descripcion ?? "",
    fechaInicio: toDateInput(row.fechaInicio),
    fechaFin: row.fechaFin ? toDateInput(row.fechaFin) : "",
  };
}

/**
 * Cuerpo para crear (POST) o editar (PATCH).
 *
 * En una edición, si la descripción queda vacía se manda `null` para borrarla.
 * `fechaFin` vacía se omite: el backend no permite dejarla en `null` al editar.
 */
export function toBody(
  values: MovimientoFormValues,
  config: MovimientoConfig,
  mode: "create" | "update",
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    tipoId: Number(values.tipoId),
    monto: Number(parseMonto(values.monto).toFixed(2)),
    fechaInicio: dateInputToIso(values.fechaInicio),
  };

  if (values.secondaryId !== "") {
    body[config.secondaryField] = Number(values.secondaryId);
  } else if (mode === "update") {
    body[config.secondaryField] = null;
  }

  const descripcion = values.descripcion.trim();
  if (descripcion !== "") body.descripcion = descripcion;
  else if (mode === "update") body.descripcion = null;

  if (values.fechaFin !== "") body.fechaFin = dateInputToIso(values.fechaFin);

  return body;
}
