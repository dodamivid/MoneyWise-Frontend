import "server-only";

import { ApiConfigError, getApiConfig } from "./config";
import { networkError, normalizeResponse, type ApiResult } from "./envelope";
import type { BackendIdentity } from "./identity";

const REQUEST_TIMEOUT_MS = 15_000;

/** Módulos de `/api/v1` que el navegador puede alcanzar a través del proxy. */
const V1_MODULES = new Set([
  "ingresos",
  "egresos",
  "inversiones",
  "metas",
  "catalogos",
  "dashboard",
  "ahorro",
  "version",
]);

/**
 * Traduce la ruta del proxy (`/api/mw/<segmentos>`) a la ruta real del backend.
 * Devuelve `null` si la ruta no está permitida, para que el proxy no sea un
 * reenviador abierto.
 *
 *   health            -> /health
 *   v1/<módulo>/...   -> /api/v1/<módulo>/...
 *   users/...         -> /api/users/...
 *
 * `v1/auth` no está en la lista: el login y el registro los atiende el
 * servidor (issue #4) para que el token nunca llegue al navegador.
 */
export function resolveBackendPath(segments: string[]): string | null {
  if (segments.length === 0 || segments.length > 8) return null;
  const clean = segments.every(
    (s) => s !== "" && s !== "." && s !== ".." && !/[\\/?#%\u0000]/.test(s),
  );
  if (!clean) return null;

  const [first, second] = segments;
  if (first === "health" && segments.length === 1) return "/health";
  if (first === "v1" && second && V1_MODULES.has(second)) {
    return `/api/${segments.join("/")}`;
  }
  if (first === "users" && segments.length >= 2) {
    return `/api/${segments.join("/")}`;
  }
  return null;
}

export interface BackendRequest {
  method: string;
  /** Ruta ya resuelta, por ejemplo `/api/v1/ingresos`. */
  path: string;
  /** Query string con o sin `?`. */
  search?: string;
  /** Cuerpo JSON ya serializado. */
  body?: string;
  identity?: BackendIdentity | null;
}

/**
 * Llama al backend de Railway agregando la `x-api-key`. Es el único lugar del
 * proyecto donde se arma una petición al backend. Nunca lanza: devuelve un
 * `ApiResult` con el error normalizado, incluido el `traceId` si existe.
 */
export async function callBackend<T = unknown>(
  request: BackendRequest,
): Promise<ApiResult<T>> {
  let config: ReturnType<typeof getApiConfig>;
  try {
    config = getApiConfig();
  } catch (error) {
    if (error instanceof ApiConfigError) {
      console.error(`[api] ${error.message}`);
      return {
        ok: false,
        error: {
          status: 500,
          mensaje:
            "El servidor no está configurado para conectarse a MoneyWise. Avisa a quien administra la app.",
          codigo: "CONFIG",
        },
      };
    }
    throw error;
  }

  const headers: Record<string, string> = {
    accept: "application/json",
    "x-api-key": config.apiKey,
    "x-correlation-id": crypto.randomUUID(),
  };
  if (request.body !== undefined) headers["content-type"] = "application/json";
  if (request.identity) {
    headers["x-mw-user"] = request.identity.userId;
    headers["x-mw-scopes"] = request.identity.scopes.join(",");
  }

  const search = request.search
    ? request.search.startsWith("?")
      ? request.search
      : `?${request.search}`
    : "";

  try {
    const response = await fetch(`${config.baseUrl}${request.path}${search}`, {
      method: request.method,
      headers,
      body: request.body,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const text = await response.text();
    let parsed: unknown = undefined;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = undefined;
      }
    }

    // 204 y cuerpos vacíos exitosos no traen JSON: son un éxito sin datos.
    if (response.ok && text === "") {
      return { ok: true, status: response.status, data: null as T };
    }

    const result = normalizeResponse<T>(
      response.status,
      parsed,
      response.headers.get("x-trace-id"),
    );

    // Un 401 por x-api-key es un problema de configuración del servidor, no de
    // la sesión de la persona: no debe mostrarse como "inicia sesión".
    if (
      !result.ok &&
      result.error.status === 401 &&
      /x-api-key/i.test(result.error.mensaje)
    ) {
      console.error(
        `[api] El backend rechazó la x-api-key (traceId ${result.error.traceId ?? "n/d"}).`,
      );
      return {
        ok: false,
        error: {
          ...result.error,
          status: 500,
          mensaje:
            "El servidor no pudo autenticarse con MoneyWise. Avisa a quien administra la app.",
          codigo: "CONFIG",
        },
      };
    }

    return result;
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === "TimeoutError";
    return networkError(
      timedOut ? 504 : 502,
      timedOut
        ? "El servidor tardó demasiado en responder. Inténtalo de nuevo."
        : "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
    );
  }
}
