import { describe, expect, it } from "vitest";

import {
  cambioContrasenaSchema,
  loginSchema,
  perfilSchema,
  registroSchema,
} from "./schemas";

function firstError(result: {
  success: boolean;
  error?: { issues: { message: string }[] };
}) {
  return result.success ? undefined : result.error?.issues[0]?.message;
}

const registro = {
  nombre: "Ana",
  apellidoP: "López",
  apellidoM: "Díaz",
  correo: "ana@example.com",
  fechaN: "1995-04-12",
  contrasena: "Secreta123",
  confirmarContrasena: "Secreta123",
};

describe("loginSchema", () => {
  it("acepta correo y contraseña", () => {
    expect(
      loginSchema.safeParse({ correo: "a@b.co", contrasena: "x" }).success,
    ).toBe(true);
  });

  it("explica qué falta", () => {
    expect(
      firstError(loginSchema.safeParse({ correo: "", contrasena: "x" })),
    ).toBe("Escribe tu correo electrónico.");
    expect(
      firstError(loginSchema.safeParse({ correo: "nope", contrasena: "x" })),
    ).toMatch(/correo válido/);
    expect(
      firstError(loginSchema.safeParse({ correo: "a@b.co", contrasena: "" })),
    ).toBe("Escribe tu contraseña.");
  });
});

describe("registroSchema", () => {
  it("acepta un registro válido", () => {
    expect(registroSchema.safeParse(registro).success).toBe(true);
  });

  it("exige mayúscula, minúscula y número en la contraseña", () => {
    const check = (contrasena: string) =>
      firstError(
        registroSchema.safeParse({
          ...registro,
          contrasena,
          confirmarContrasena: contrasena,
        }),
      );
    expect(check("corta1A")).toMatch(/8 caracteres/);
    expect(check("sinmayuscula1")).toMatch(/mayúscula/);
    expect(check("SINMINUSCULA1")).toMatch(/minúscula/);
    expect(check("SinNumeroAqui")).toMatch(/número/);
  });

  it("las contraseñas deben coincidir", () => {
    expect(
      firstError(
        registroSchema.safeParse({
          ...registro,
          confirmarContrasena: "Otra123456",
        }),
      ),
    ).toBe("Las contraseñas no coinciden.");
  });

  it("pide tener al menos 16 años", () => {
    const year = new Date().getFullYear() - 10;
    expect(
      firstError(
        registroSchema.safeParse({ ...registro, fechaN: `${year}-01-01` }),
      ),
    ).toMatch(/16 años/);
  });
});

describe("perfilSchema", () => {
  it("solo admite letras y espacios, como el backend", () => {
    const base = {
      nombre: "Ana María",
      apellidoP: "López",
      apellidoM: "Díaz",
      fechaN: "1995-04-12",
    };
    expect(perfilSchema.safeParse(base).success).toBe(true);
    expect(
      firstError(perfilSchema.safeParse({ ...base, nombre: "Ana2" })),
    ).toMatch(/solo puede tener letras/);
  });
});

describe("cambioContrasenaSchema", () => {
  it("la nueva debe ser distinta de la actual", () => {
    expect(
      firstError(
        cambioContrasenaSchema.safeParse({
          contrasenaActual: "Secreta123",
          contrasenaNueva: "Secreta123",
          confirmarContrasena: "Secreta123",
        }),
      ),
    ).toMatch(/distinta de la actual/);
  });
});
