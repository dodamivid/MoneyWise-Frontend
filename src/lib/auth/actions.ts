"use server";

import { redirect } from "next/navigation";

import { callBackend } from "@/lib/api/backend";
import type { AccesoData } from "@/lib/api/types";
import {
  deleteSession,
  createSession,
  getSession,
  SessionConfigError,
} from "./session";
import {
  loginSchema,
  olvidoSchema,
  registroSchema,
  restablecerSchema,
  type LoginValues,
  type OlvidoValues,
  type RegistroValues,
  type RestablecerValues,
} from "./schemas";

/** Resultado de una acción que falló. Si sale bien, la acción redirige. */
export interface ActionFailure {
  ok: false;
  mensaje: string;
  /** Errores por campo, con el mismo nombre que el formulario. */
  campos?: Partial<Record<string, string>>;
  traceId?: string;
}

/** Solo rutas internas: evita que `?next=` mande a otro sitio. */
function safeNext(next: string | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    if (!next.includes("\\") && !next.startsWith("/login")) return next;
  }
  return "/";
}

async function iniciarSesion(
  correo: string,
  contrasena: string,
): Promise<ActionFailure | { ok: true }> {
  const result = await callBackend<AccesoData>({
    method: "POST",
    path: "/api/v1/auth/acceso",
    body: JSON.stringify({ correo, contrasena }),
  });

  if (!result.ok) {
    const { error } = result;
    const credenciales = error.status === 401 && error.codigo !== "CONFIG";
    return {
      ok: false,
      mensaje: credenciales
        ? "El correo o la contraseña no coinciden. Revisa tus datos e inténtalo de nuevo."
        : error.mensaje,
      traceId: error.traceId,
    };
  }

  const usuario = result.data.usuario;
  try {
    await createSession({
      usuarioId: usuario.usuarioId,
      nombre: usuario.nombre,
      correo: usuario.correo,
      scopes: usuario.scopes ?? [],
    });
  } catch (error) {
    if (error instanceof SessionConfigError) {
      console.error(`[auth] ${error.message}`);
      return {
        ok: false,
        mensaje:
          "No pudimos abrir tu sesión por un problema de configuración. Avisa a quien administra la app.",
      };
    }
    throw error;
  }
  return { ok: true };
}

export async function loginAction(
  input: LoginValues,
  next?: string,
): Promise<ActionFailure> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, mensaje: "Revisa los datos del formulario." };
  }

  const result = await iniciarSesion(
    parsed.data.correo,
    parsed.data.contrasena,
  );
  if (!result.ok) return result;

  redirect(safeNext(next));
}

export async function registroAction(
  input: RegistroValues,
): Promise<ActionFailure> {
  const parsed = registroSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, mensaje: "Revisa los datos del formulario." };
  }

  // Se arma el cuerpo campo por campo: `confirmarContrasena` es solo del front.
  const { nombre, apellidoP, apellidoM, correo, fechaN, contrasena } =
    parsed.data;
  const registro = await callBackend({
    method: "POST",
    path: "/api/v1/auth/registro",
    body: JSON.stringify({
      nombre,
      apellidoP,
      apellidoM,
      correo,
      fechaN,
      contrasena,
    }),
  });

  if (!registro.ok) {
    const { error } = registro;
    if (error.status === 409) {
      return {
        ok: false,
        mensaje:
          "Ese correo ya tiene una cuenta. Inicia sesión o usa otro correo.",
        campos: { correo: "Este correo ya está registrado." },
        traceId: error.traceId,
      };
    }
    return { ok: false, mensaje: error.mensaje, traceId: error.traceId };
  }

  // Cuenta creada: se abre la sesión directo para no pedir los datos otra vez.
  const acceso = await iniciarSesion(
    parsed.data.correo,
    parsed.data.contrasena,
  );
  if (!acceso.ok) redirect("/login?registrado=1");

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}

// ── Recuperación de contraseña y datos de sesión (issue #13) ────────────────

export type OlvidoResult = { ok: true } | ActionFailure;

/**
 * Pide el enlace de recuperación. El backend responde igual exista o no el
 * correo, y aquí tampoco se revela: así no se puede averiguar quién tiene
 * cuenta.
 */
export async function olvidoAction(input: OlvidoValues): Promise<OlvidoResult> {
  const parsed = olvidoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, mensaje: "Revisa el correo e inténtalo de nuevo." };
  }

  const result = await callBackend({
    method: "POST",
    path: "/api/v1/auth/olvido",
    body: JSON.stringify({ correo: parsed.data.correo }),
  });
  if (!result.ok) {
    return {
      ok: false,
      mensaje: result.error.mensaje,
      traceId: result.error.traceId,
    };
  }
  return { ok: true };
}

export type RestablecerResult = { ok: true } | ActionFailure;

export async function restablecerAction(
  token: string,
  input: RestablecerValues,
): Promise<RestablecerResult> {
  const parsed = restablecerSchema.safeParse(input);
  if (!parsed.success || !token) {
    return { ok: false, mensaje: "Revisa los datos e inténtalo de nuevo." };
  }

  const result = await callBackend({
    method: "POST",
    path: "/api/v1/auth/restablecer",
    body: JSON.stringify({
      token,
      contrasenaNueva: parsed.data.contrasenaNueva,
    }),
  });
  if (!result.ok) {
    const { error } = result;
    const caducado = error.status === 400 || error.status === 422;
    return {
      ok: false,
      mensaje: caducado
        ? "El enlace ya no es válido o caducó. Pide uno nuevo desde “¿Olvidaste tu contraseña?”."
        : error.mensaje,
      traceId: error.traceId,
    };
  }
  return { ok: true };
}

/**
 * Actualiza el nombre guardado en la cookie de sesión después de editar el
 * perfil, para que el saludo no muestre el nombre anterior.
 */
export async function actualizarNombreSesionAction(
  nombre: string,
): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await createSession({
    usuarioId: session.sub,
    nombre: nombre.trim(),
    correo: session.correo,
    scopes: session.scopes,
  });
}
