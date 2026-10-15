/**
 * Firma y verificación del token de sesión con Web Crypto (HMAC-SHA256).
 *
 * Es código puro, sin `server-only` ni `next/headers`, para que lo usen tanto
 * `session.ts` (cookies) como `proxy.ts`. No guarda secretos: solo la
 * identidad que el backend necesita (`x-mw-user` y `x-mw-scopes`) y la
 * caducidad. La firma evita que alguien edite la cookie a mano.
 */

export const SESSION_COOKIE = "mw_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface SessionPayload {
  /** `usuarioId` del backend, como texto (es el valor de `x-mw-user`). */
  sub: string;
  nombre: string;
  correo: string;
  scopes: string[];
  /** Caducidad en segundos desde epoch. */
  exp: number;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages,
  );
}

export async function signToken(
  payload: SessionPayload,
  secret: string,
): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/** Devuelve el payload si la firma es válida y no ha caducado; si no, `null`. */
export async function verifyToken(
  token: string,
  secret: string,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<SessionPayload | null> {
  const [body, signature, ...rest] = token.split(".");
  if (!body || !signature || rest.length > 0) return null;

  try {
    const key = await hmacKey(secret, ["verify"]);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signature) as BufferSource,
      encoder.encode(body),
    );
    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body)),
    ) as Partial<SessionPayload>;

    if (
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= nowSeconds ||
      !Array.isArray(payload.scopes)
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      nombre: typeof payload.nombre === "string" ? payload.nombre : "",
      correo: typeof payload.correo === "string" ? payload.correo : "",
      scopes: payload.scopes.filter((s): s is string => typeof s === "string"),
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
