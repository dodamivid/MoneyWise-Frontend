import { z } from "zod";

import { dateInputToIso } from "@/lib/format";
import { parseMonto } from "@/lib/movimientos/schema";

/**
 * Formulario de inversiones. Reglas del backend (`src/dtos/inversiones.dto.ts`):
 * `monto` > 0, `objetivo` de 1 a 120 caracteres, `tasaInteresPorc` de 0 a 100 y
 * `fechaFin` >= `fechaInicio`.
 */
export const inversionSchema = z
  .object({
    objetivo: z
      .string()
      .trim()
      .min(1, "Escribe en qué estás invirtiendo.")
      .max(120, "El texto no puede pasar de 120 caracteres."),
    monto: z
      .string()
      .trim()
      .min(1, "Escribe el monto invertido.")
      .refine(
        (v) => !Number.isNaN(parseMonto(v)),
        "Escribe solo números, por ejemplo 5000.",
      )
      .refine((v) => parseMonto(v) > 0, "El monto debe ser mayor a 0.")
      .refine(
        (v) => Number(parseMonto(v).toFixed(2)) === parseMonto(v),
        "El monto puede tener máximo 2 decimales.",
      ),
    tasaInteresPorc: z
      .string()
      .trim()
      .min(1, "Escribe la tasa de interés (0 si no tiene).")
      .refine(
        (v) => !Number.isNaN(parseMonto(v)),
        "Escribe solo números, por ejemplo 10.5.",
      )
      .refine(
        (v) => parseMonto(v) >= 0 && parseMonto(v) <= 100,
        "La tasa debe estar entre 0 y 100.",
      ),
    destinoId: z.string(),
    fechaInicio: z
      .string()
      .min(1, "Elige la fecha de inicio.")
      .refine((v) => dateInputToIso(v) !== null, "Elige una fecha válida."),
    fechaFin: z.string(),
  })
  .refine((v) => v.fechaFin === "" || dateInputToIso(v.fechaFin) !== null, {
    path: ["fechaFin"],
    message: "Elige una fecha válida.",
  })
  .refine((v) => v.fechaFin === "" || v.fechaFin >= v.fechaInicio, {
    path: ["fechaFin"],
    message: "La fecha final no puede ser anterior a la de inicio.",
  });

export type InversionFormValues = z.infer<typeof inversionSchema>;

export const INVERSION_FIELDS = [
  "objetivo",
  "monto",
  "tasaInteresPorc",
  "destinoId",
  "fechaInicio",
  "fechaFin",
] as const;
export type InversionField = (typeof INVERSION_FIELDS)[number];

export function emptyInversion(today: string): InversionFormValues {
  return {
    objetivo: "",
    monto: "",
    tasaInteresPorc: "0",
    destinoId: "",
    fechaInicio: today,
    fechaFin: "",
  };
}

/**
 * Cuerpo para crear o editar. En inversiones el backend sí acepta `null` en
 * `destinoId` y en `fechaFin`, así que al editar se pueden vaciar.
 */
export function toInversionBody(values: InversionFormValues) {
  return {
    objetivo: values.objetivo.trim(),
    monto: Number(parseMonto(values.monto).toFixed(2)),
    tasaInteresPorc: Number(parseMonto(values.tasaInteresPorc)),
    destinoId: values.destinoId === "" ? null : Number(values.destinoId),
    fechaInicio: dateInputToIso(values.fechaInicio),
    fechaFin: values.fechaFin === "" ? null : dateInputToIso(values.fechaFin),
  };
}
