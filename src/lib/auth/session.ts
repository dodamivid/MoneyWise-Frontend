import "server-only";

import { cookies } from "next/headers";

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signToken,
  verifyToken,
  type SessionPayload,
} from "./token";

export type { SessionPayload };

/** Error de configuración: se muestra a quien administra, no a la persona. */
export class SessionConfigError extends Error {}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new SessionConfigError(
      "Falta SESSION_SECRET (mínimo 32 caracteres). Genera una con: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return secret;
}

export interface NewSession {
  usuarioId: number | string;
  nombre: string;
  correo: string;
  scopes: string[];
}

/** Crea la cookie httpOnly de sesión. Solo se puede llamar en el servidor. */
export async function createSession(user: NewSession): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const token = await signToken(
    {
      sub: String(user.usuarioId),
      nombre: user.nombre,
      correo: user.correo,
      scopes: user.scopes,
      exp,
    },
    getSecret(),
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Sesión vigente o `null`. Verifica la firma cada vez que se llama. */
export async function getSession(): Promise<SessionPayload | null> {
  // Leer las cookies primero marca la ruta como dinámica. Si se saliera antes
  // (por ejemplo sin SESSION_SECRET durante el build), Next la prerenderizaría
  // y serviría la misma página a todas las personas.
  const cookieStore = await cookies();
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) return null;

  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token, secret);
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
