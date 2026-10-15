import { z } from "zod";

import { dateInputToIso } from "@/lib/format";
import { parseMonto } from "@/lib/movimientos/schema";

/**
 * Esquema del formulario de metas. Reglas tomadas de `docs/api-metas.md` del
 * backend: nombre de 1 a 120 caracteres, `montoObjetivo` > 0 con hasta 2
 * decimales, `ahorroReal` entre 0 y `montoObjetivo`, y `fechaFin` >= inicio.
 */

const money = (obligatorio: string) =>
  z
    .string()
    .trim()
    .min(1, obligatorio)
    .refine(
      (v) => !Number.isNaN(parseMonto(v)),
      "Escribe solo números, por ejemplo 1250.50.",
    )
    .refine(
      (v) => Number(parseMonto(v).toFixed(2)) === parseMonto(v),
      "Puede tener máximo 2 decimales.",
    );

export const metaSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, "Ponle un nombre a tu meta.")
      .max(120, "El nombre no puede pasar de 120 caracteres."),
    montoObjetivo: money("Escribe cuánto quieres juntar.").refine(
      (v) => parseMonto(v) > 0,
      "El monto objetivo debe ser mayor a 0.",
    ),
    ahorroReal: money("Escribe cuánto llevas ahorrado (0 si nada)."),
    fechaInicio: z
      .string()
      .min(1, "Elige la fecha de inicio.")
      .refine((v) => dateInputToIso(v) !== null, "Elige una fecha válida."),
    fechaFin: z.string(),
    activa: z.boolean(),
  })
  .refine((v) => v.fechaFin === "" || dateInputToIso(v.fechaFin) !== null, {
    path: ["fechaFin"],
    message: "Elige una fecha válida.",
  })
  .refine((v) => v.fechaFin === "" || v.fechaFin >= v.fechaInicio, {
    path: ["fechaFin"],
    message: "La fecha final no puede ser anterior a la de inicio.",
  })
  .refine(
    (v) => {
      const ahorro = parseMonto(v.ahorroReal);
      const objetivo = parseMonto(v.montoObjetivo);
      if (Number.isNaN(ahorro) || Number.isNaN(objetivo)) return true;
      return ahorro <= objetivo;
    },
    {
      path: ["ahorroReal"],
      message: "Lo ahorrado no puede ser mayor que el monto objetivo.",
    },
  )
  .refine(
    (v) =>
      parseMonto(v.ahorroReal) >= 0 || Number.isNaN(parseMonto(v.ahorroReal)),
    {
      path: ["ahorroReal"],
      message: "Lo ahorrado no puede ser negativo.",
    },
  );

export type MetaFormValues = z.infer<typeof metaSchema>;

export const META_FIELDS = [
  "nombre",
  "montoObjetivo",
  "ahorroReal",
  "fechaInicio",
  "fechaFin",
  "activa",
] as const;
export type MetaField = (typeof META_FIELDS)[number];

export function emptyMeta(today: string): MetaFormValues {
  return {
    nombre: "",
    montoObjetivo: "",
    ahorroReal: "0",
    fechaInicio: today,
    fechaFin: "",
    activa: true,
  };
}

/** Cuerpo para crear: `ahorroReal` no se manda, empieza en 0. */
export function toCreateBody(values: MetaFormValues, usuarioId: number) {
  return {
    usuarioId,
    nombre: values.nombre.trim(),
    montoObjetivo: Number(parseMonto(values.montoObjetivo).toFixed(2)),
    fechaInicio: dateInputToIso(values.fechaInicio),
    ...(values.fechaFin !== ""
      ? { fechaFin: dateInputToIso(values.fechaFin) }
      : {}),
    activa: values.activa,
  };
}

/** Cuerpo para editar. Una `fechaFin` vacía se omite (no se puede quitar). */
export function toUpdateBody(values: MetaFormValues) {
  return {
    nombre: values.nombre.trim(),
    montoObjetivo: Number(parseMonto(values.montoObjetivo).toFixed(2)),
    ahorroReal: Number(parseMonto(values.ahorroReal).toFixed(2)),
    fechaInicio: dateInputToIso(values.fechaInicio),
    ...(values.fechaFin !== ""
      ? { fechaFin: dateInputToIso(values.fechaFin) }
      : {}),
    activa: values.activa,
  };
}
