/**
 * Normaliza las respuestas del backend a una sola forma.
 *
 * El backend no es uniforme entre módulos:
 *  - éxito:   { ok: true, data, meta? }
 *  - error 1: { ok: false, mensaje, codigo?, traceId?, detalles? }
 *  - error 2: { ok: false, error: { codigo, mensaje, ... } }   (scopes, metas)
 *  - error 3: { status: "error", message, statusCode }         (ruta no encontrada)
 *
 * Este archivo no depende del servidor, así que lo usan el proxy y el cliente.
 */

export interface ApiPagination {
  pagina: number;
  tamanoPagina: number;
  total: number;
}

export interface ApiMeta {
  paginacion?: ApiPagination;
}

export interface ApiError {
  /** Código HTTP de la respuesta (o 502/504 si no hubo respuesta). */
  status: number;
  /** Texto que se puede mostrar a la persona usuaria. */
  mensaje: string;
  codigo?: string;
  /** Identificador para rastrear la petición en los logs del backend. */
  traceId?: string;
  detalles?: unknown;
}

export type ApiResult<T> =
  | { ok: true; status: number; data: T; meta?: ApiMeta; traceId?: string }
  | { ok: false; error: ApiError };

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value : undefined;

const asCode = (value: unknown): string | undefined =>
  typeof value === "number" ? String(value) : asString(value);

/** Mensajes de respaldo cuando el backend no manda uno legible. */
export function defaultMessage(status: number): string {
  if (status === 400 || status === 422) {
    return "Revisa los datos e inténtalo de nuevo.";
  }
  if (status === 401) return "No pudimos validar tu acceso. Inicia sesión.";
  if (status === 403) return "No tienes permiso para hacer esto.";
  if (status === 404) return "No encontramos lo que buscabas.";
  if (status === 409) return "Esta acción choca con información existente.";
  if (status >= 500) {
    return "El servidor no pudo completar la operación. Inténtalo de nuevo en unos minutos.";
  }
  return "No se pudo completar la operación.";
}

export function normalizeResponse<T>(
  status: number,
  body: unknown,
  traceIdHeader?: string | null,
): ApiResult<T> {
  const json = isObject(body) ? body : undefined;
  const nested = json && isObject(json.error) ? json.error : undefined;
  const detalles = json && isObject(json.detalles) ? json.detalles : undefined;

  const traceId =
    asString(traceIdHeader) ??
    asString(json?.traceId) ??
    asString(nested?.traceId) ??
    asString(detalles?.traceId);

  const failed =
    status >= 400 ||
    json?.ok === false ||
    json?.status === "error" ||
    json === undefined;

  if (!failed && json) {
    const data = ("data" in json ? json.data : json) as T;
    const meta = isObject(json.meta) ? (json.meta as ApiMeta) : undefined;
    return { ok: true, status, data, meta, traceId };
  }

  const errorStatus = status >= 400 ? status : 502;
  const mensaje =
    asString(json?.mensaje) ??
    asString(nested?.mensaje) ??
    asString(json?.message) ??
    asString(nested?.message) ??
    asString(json?.error) ??
    defaultMessage(errorStatus);

  return {
    ok: false,
    error: {
      status: errorStatus,
      mensaje,
      codigo:
        asCode(json?.codigo) ?? asCode(nested?.codigo) ?? asCode(json?.code),
      traceId,
      detalles: detalles ?? nested?.detalles ?? json?.errors,
    },
  };
}

export function networkError(
  status: 502 | 504,
  mensaje: string,
): ApiResult<never> {
  return { ok: false, error: { status, mensaje, codigo: "RED" } };
}
