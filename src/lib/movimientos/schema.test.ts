import { describe, expect, it } from "vitest";

import { MOVIMIENTOS } from "./config";
import {
  emptyValues,
  movimientoSchema,
  parseMonto,
  toBody,
  type MovimientoFormValues,
} from "./schema";

const base: MovimientoFormValues = {
  ...emptyValues("2026-08-05"),
  tipoId: "3",
  monto: "1,250.50",
};

function errorsOf(values: MovimientoFormValues) {
  const result = movimientoSchema.safeParse(values);
  if (result.success) return {};
  // La interfaz muestra el primer error de cada campo: aquí igual.
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0]);
    if (!(field in errors)) errors[field] = issue.message;
  }
  return errors;
}

describe("parseMonto", () => {
  it("acepta miles, símbolo y espacios", () => {
    expect(parseMonto("1,250.50")).toBe(1250.5);
    expect(parseMonto(" $ 99 ")).toBe(99);
  });

  it("devuelve NaN con texto o vacío", () => {
    expect(parseMonto("abc")).toBeNaN();
    expect(parseMonto("")).toBeNaN();
    expect(parseMonto("1.2.3")).toBeNaN();
  });
});

describe("movimientoSchema", () => {
  it("acepta un movimiento válido", () => {
    expect(movimientoSchema.safeParse(base).success).toBe(true);
  });

  it("pide tipo, monto y fecha", () => {
    const errors = errorsOf({
      ...base,
      tipoId: "",
      monto: "",
      fechaInicio: "",
    });
    expect(errors.tipoId).toBe("Elige un tipo.");
    expect(errors.monto).toBe("Escribe el monto.");
    expect(errors.fechaInicio).toBe("Elige la fecha.");
  });

  it("rechaza montos en cero, negativos, con texto o con 3 decimales", () => {
    expect(errorsOf({ ...base, monto: "0" }).monto).toMatch(/mayor a 0/);
    expect(errorsOf({ ...base, monto: "-5" }).monto).toBeDefined();
    expect(errorsOf({ ...base, monto: "diez" }).monto).toMatch(/solo números/);
    expect(errorsOf({ ...base, monto: "10.555" }).monto).toMatch(/2 decimales/);
  });

  it("la fecha final no puede ser anterior a la inicial", () => {
    const errors = errorsOf({ ...base, fechaFin: "2026-08-01" });
    expect(errors.fechaFin).toMatch(/anterior/);
  });

  it("limita la descripción a 255 caracteres", () => {
    expect(
      errorsOf({ ...base, descripcion: "x".repeat(256) }).descripcion,
    ).toBeDefined();
  });
});

describe("toBody", () => {
  const ingreso = MOVIMIENTOS.ingreso;
  const egreso = MOVIMIENTOS.egreso;

  it("arma el cuerpo de un alta con la fecha a mediodía de México", () => {
    expect(
      toBody(
        { ...base, secondaryId: "2", descripcion: " Sueldo " },
        ingreso,
        "create",
      ),
    ).toEqual({
      tipoId: 3,
      procedenciaId: 2,
      monto: 1250.5,
      descripcion: "Sueldo",
      fechaInicio: "2026-08-05T18:00:00.000Z",
    });
  });

  it("en un alta omite lo que está vacío", () => {
    const body = toBody(base, ingreso, "create");
    expect(body).not.toHaveProperty("procedenciaId");
    expect(body).not.toHaveProperty("descripcion");
    expect(body).not.toHaveProperty("fechaFin");
  });

  it("al editar un ingreso, vaciar manda null", () => {
    const body = toBody(base, ingreso, "update");
    expect(body.procedenciaId).toBeNull();
    expect(body.descripcion).toBeNull();
  });

  it("al editar un egreso, vaciar se omite porque el backend rechaza null", () => {
    const body = toBody(base, egreso, "update");
    expect(body).not.toHaveProperty("destinoId");
    expect(body).not.toHaveProperty("descripcion");
  });

  it("usa el campo secundario de cada tipo", () => {
    expect(
      toBody({ ...base, secondaryId: "4" }, egreso, "create"),
    ).toHaveProperty("destinoId", 4);
  });
});
