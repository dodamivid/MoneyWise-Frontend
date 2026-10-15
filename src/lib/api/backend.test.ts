import { describe, expect, it } from "vitest";

import { resolveBackendPath } from "./backend";

describe("resolveBackendPath", () => {
  it("traduce las rutas permitidas", () => {
    expect(resolveBackendPath(["health"])).toBe("/health");
    expect(resolveBackendPath(["v1", "ingresos"])).toBe("/api/v1/ingresos");
    expect(resolveBackendPath(["v1", "ingresos", "12"])).toBe(
      "/api/v1/ingresos/12",
    );
    expect(resolveBackendPath(["v1", "catalogos", "frecuencias"])).toBe(
      "/api/v1/catalogos/frecuencias",
    );
    expect(resolveBackendPath(["v1", "ahorro", "fechas-corte"])).toBe(
      "/api/v1/ahorro/fechas-corte",
    );
    expect(resolveBackendPath(["users", "7", "contrasena"])).toBe(
      "/api/users/7/contrasena",
    );
  });

  it("no deja pasar el login ni el registro por el proxy", () => {
    expect(resolveBackendPath(["v1", "auth", "acceso"])).toBeNull();
    expect(resolveBackendPath(["v1", "auth", "registro"])).toBeNull();
  });

  it("rechaza módulos y rutas que no están en la lista", () => {
    expect(resolveBackendPath([])).toBeNull();
    expect(resolveBackendPath(["v1", "test"])).toBeNull();
    expect(resolveBackendPath(["docs"])).toBeNull();
    expect(resolveBackendPath(["users"])).toBeNull();
    expect(resolveBackendPath(["health", "extra"])).toBeNull();
  });

  it("rechaza intentos de salirse de la ruta", () => {
    expect(resolveBackendPath(["v1", "ingresos", ".."])).toBeNull();
    expect(resolveBackendPath(["v1", "ingresos", "../../health"])).toBeNull();
    expect(resolveBackendPath(["v1", "ingresos", "a%2Fb"])).toBeNull();
    expect(resolveBackendPath(["v1", "ingresos", "a\\b"])).toBeNull();
    expect(resolveBackendPath(["v1", "ingresos", ""])).toBeNull();
  });
});
