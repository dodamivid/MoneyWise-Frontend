import { describe, expect, it } from "vitest";

import { signToken, verifyToken, type SessionPayload } from "./token";

const SECRET = "una-clave-de-prueba-de-al-menos-32-caracteres";
const NOW = 1_800_000_000;

const payload: SessionPayload = {
  sub: "7",
  nombre: "Ana",
  correo: "ana@example.com",
  scopes: ["ingresos:leer", "ingresos:escribir"],
  exp: NOW + 600,
};

describe("token de sesión", () => {
  it("un token firmado se verifica y devuelve la identidad", async () => {
    const token = await signToken(payload, SECRET);
    expect(await verifyToken(token, SECRET, NOW)).toEqual(payload);
  });

  it("rechaza un token caducado", async () => {
    const token = await signToken({ ...payload, exp: NOW - 1 }, SECRET);
    expect(await verifyToken(token, SECRET, NOW)).toBeNull();
  });

  it("rechaza un token con otra clave", async () => {
    const token = await signToken(payload, SECRET);
    expect(await verifyToken(token, `${SECRET}x`, NOW)).toBeNull();
  });

  it("rechaza un token manipulado", async () => {
    const token = await signToken(payload, SECRET);
    const [body, signature] = token.split(".");
    const forged = JSON.stringify({ ...payload, sub: "1" });
    const tampered = `${btoa(forged).replace(/=+$/, "")}.${signature}`;
    expect(await verifyToken(tampered, SECRET, NOW)).toBeNull();
    expect(await verifyToken(`${body}x.${signature}`, SECRET, NOW)).toBeNull();
  });

  it("rechaza basura", async () => {
    expect(await verifyToken("", SECRET, NOW)).toBeNull();
    expect(await verifyToken("a.b.c", SECRET, NOW)).toBeNull();
    expect(await verifyToken("sin-punto", SECRET, NOW)).toBeNull();
  });

  it("conserva acentos del nombre", async () => {
    const token = await signToken({ ...payload, nombre: "María José" }, SECRET);
    const verified = await verifyToken(token, SECRET, NOW);
    expect(verified?.nombre).toBe("María José");
  });
});
