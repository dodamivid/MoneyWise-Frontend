import { describe, expect, it } from "vitest";

import { normalizeResponse } from "./envelope";

describe("normalizeResponse · éxito", () => {
  it("toma `data` y `meta` de { ok, data, meta }", () => {
    const result = normalizeResponse<number[]>(200, {
      ok: true,
      data: [1, 2],
      meta: { paginacion: { pagina: 1, tamanoPagina: 20, total: 2 } },
    });
    expect(result).toMatchObject({ ok: true, status: 200, data: [1, 2] });
    expect(result.ok && result.meta?.paginacion?.total).toBe(2);
  });

  it("acepta { status: 'success', data }", () => {
    const result = normalizeResponse(200, {
      status: "success",
      data: { a: 1 },
    });
    expect(result).toMatchObject({ ok: true, data: { a: 1 } });
  });

  it("toma el X-Trace-Id del header", () => {
    const result = normalizeResponse(200, { ok: true, data: {} }, "trace-1");
    expect(result.ok && result.traceId).toBe("trace-1");
  });
});

describe("normalizeResponse · errores", () => {
  it("lee { ok: false, mensaje, codigo, traceId }", () => {
    const result = normalizeResponse(404, {
      ok: false,
      mensaje: "Usuario no encontrado",
      codigo: 404,
      traceId: "abc",
    });
    expect(result).toEqual({
      ok: false,
      error: {
        status: 404,
        mensaje: "Usuario no encontrado",
        codigo: "404",
        traceId: "abc",
        detalles: undefined,
      },
    });
  });

  it("lee { ok: false, error: { codigo, mensaje, detalles } }", () => {
    const detalles = [{ path: ["monto"], message: "monto debe ser positivo" }];
    const result = normalizeResponse(422, {
      ok: false,
      error: {
        codigo: "DATOS_INVALIDOS",
        mensaje: "Datos invalidos",
        detalles,
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.mensaje).toBe("Datos invalidos");
      expect(result.error.codigo).toBe("DATOS_INVALIDOS");
      expect(result.error.detalles).toEqual(detalles);
    }
  });

  it("lee { status: 'error', message }", () => {
    const result = normalizeResponse(404, {
      status: "error",
      message: "Ruta no encontrada",
      statusCode: 404,
    });
    expect(result.ok === false && result.error.mensaje).toBe(
      "Ruta no encontrada",
    );
  });

  it("el header X-Trace-Id gana sobre el traceId del cuerpo", () => {
    const result = normalizeResponse(
      500,
      { ok: false, mensaje: "x", traceId: "cuerpo" },
      "header",
    );
    expect(result.ok === false && result.error.traceId).toBe("header");
  });

  it("usa un mensaje en español si el backend no manda uno", () => {
    const result = normalizeResponse(500, { ok: false });
    expect(result.ok === false && result.error.mensaje).toMatch(
      /servidor no pudo completar/,
    );
  });

  it("trata un cuerpo que no es JSON como error", () => {
    const result = normalizeResponse(200, undefined);
    expect(result.ok).toBe(false);
  });

  it("un 200 con ok:false sigue siendo error", () => {
    const result = normalizeResponse(200, { ok: false, mensaje: "no" });
    expect(result.ok).toBe(false);
  });
});
