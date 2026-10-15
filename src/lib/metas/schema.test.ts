import { describe, expect, it } from "vitest";

import {
  emptyMeta,
  metaSchema,
  toCreateBody,
  toUpdateBody,
  type MetaFormValues,
} from "./schema";

const base: MetaFormValues = {
  ...emptyMeta("2026-08-05"),
  nombre: "Viaje a Oaxaca",
  montoObjetivo: "10000",
};

function messages(values: MetaFormValues) {
  const result = metaSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((i) => i.message);
}

describe("metaSchema", () => {
  it("acepta una meta válida", () => {
    expect(metaSchema.safeParse(base).success).toBe(true);
  });

  it("pide nombre y monto objetivo mayor a 0", () => {
    expect(messages({ ...base, nombre: " " })).toContain(
      "Ponle un nombre a tu meta.",
    );
    expect(messages({ ...base, montoObjetivo: "0" })).toContain(
      "El monto objetivo debe ser mayor a 0.",
    );
  });

  it("limita el nombre a 120 caracteres", () => {
    expect(messages({ ...base, nombre: "a".repeat(121) })).toContain(
      "El nombre no puede pasar de 120 caracteres.",
    );
  });

  it("lo ahorrado no puede superar el objetivo", () => {
    expect(messages({ ...base, ahorroReal: "10001" })).toContain(
      "Lo ahorrado no puede ser mayor que el monto objetivo.",
    );
    expect(messages({ ...base, ahorroReal: "10000" })).toEqual([]);
  });
});

describe("cuerpos para el backend", () => {
  it("al crear manda usuarioId y no manda ahorroReal", () => {
    const body = toCreateBody(base, 7);
    expect(body).toMatchObject({
      usuarioId: 7,
      nombre: "Viaje a Oaxaca",
      montoObjetivo: 10000,
      activa: true,
    });
    expect(body).not.toHaveProperty("ahorroReal");
  });

  it("al editar manda ahorroReal y omite una fechaFin vacía", () => {
    const body = toUpdateBody({ ...base, ahorroReal: "2500.5" });
    expect(body.ahorroReal).toBe(2500.5);
    expect(body).not.toHaveProperty("fechaFin");
  });
});
