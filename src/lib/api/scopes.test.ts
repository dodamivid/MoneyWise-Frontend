import { describe, expect, it } from "vitest";

import { bodyForUser, scopeSearchToUser, withMissingScopes } from "./scopes";

describe("withMissingScopes", () => {
  it("agrega los scopes de ahorro que faltan", () => {
    expect(withMissingScopes(["ingresos:leer", "dashboard:leer"])).toEqual([
      "ingresos:leer",
      "dashboard:leer",
      "ahorro:leer",
      "ahorro:escribir",
      "usuarios:leer",
      "usuarios:escribir",
    ]);
  });

  it("no duplica los que ya existen", () => {
    expect(
      withMissingScopes(["ahorro:leer", "metas:leer", "usuarios:leer"]),
    ).toEqual([
      "ahorro:leer",
      "metas:leer",
      "usuarios:leer",
      "ahorro:escribir",
      "usuarios:escribir",
    ]);
  });

  it("no muta el arreglo original", () => {
    const original = ["metas:leer"];
    withMissingScopes(original);
    expect(original).toEqual(["metas:leer"]);
  });
});

describe("scopeSearchToUser", () => {
  it("fija el usuario de la sesión al listar metas", () => {
    expect(scopeSearchToUser("GET", "/api/v1/metas", "", "9")).toBe(
      "?usuarioId=9",
    );
  });

  it("pisa el usuarioId que mande el navegador y conserva los demás filtros", () => {
    expect(
      scopeSearchToUser(
        "GET",
        "/api/v1/metas",
        "?usuarioId=1&activa=true",
        "9",
      ),
    ).toBe("?usuarioId=9&activa=true");
  });

  it("no toca otras rutas ni otros métodos", () => {
    expect(scopeSearchToUser("GET", "/api/v1/ingresos", "?a=1", "9")).toBe(
      "?a=1",
    );
    expect(scopeSearchToUser("GET", "/api/v1/metas/20", "", "9")).toBe("");
    expect(scopeSearchToUser("POST", "/api/v1/metas", "", "9")).toBe("");
  });
});

describe("bodyForUser", () => {
  it("manda el usuario de la sesión al borrar una meta", () => {
    expect(bodyForUser("DELETE", "/api/v1/metas/22", "9")).toBe(
      '{"usuarioId":9}',
    );
  });

  it("no agrega body en otros borrados ni métodos", () => {
    expect(
      bodyForUser("DELETE", "/api/v1/inversiones/22", "9"),
    ).toBeUndefined();
    expect(bodyForUser("DELETE", "/api/v1/metas", "9")).toBeUndefined();
    expect(bodyForUser("PATCH", "/api/v1/metas/22", "9")).toBeUndefined();
  });
});
