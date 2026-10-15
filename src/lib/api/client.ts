import { networkError, type ApiResult } from "./envelope";

/**
 * Cliente para usar desde el navegador. Llama al proxy (`/api/mw/...`) y
 * siempre devuelve un `ApiResult`: no lanza, así cada pantalla decide cómo
 * mostrar el error (con su `traceId` si hay que reportarlo).
 *
 *   const result = await api.get<FrecuenciaDTO[]>("/v1/catalogos/frecuencias");
 *   if (!result.ok) return <ErrorState error={result.error} />;
 */

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

function toSearch(query?: Query): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

function isApiResult(value: unknown): value is ApiResult<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { ok?: unknown }).ok === "boolean"
  );
}

export async function apiRequest<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`/api/mw${path}${toSearch(options.query)}`, {
      method,
      headers:
        options.body !== undefined
          ? { "content-type": "application/json" }
          : undefined,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
      cache: "no-store",
    });

    const json: unknown = await response.json().catch(() => undefined);
    if (isApiResult(json)) {
      // La sesión caducó: se manda a login y se regresa a esta pantalla después.
      if (!json.ok && json.error.codigo === "SIN_SESION") {
        const next = encodeURIComponent(
          `${window.location.pathname}${window.location.search}`,
        );
        window.location.replace(`/login?next=${next}`);
      }
      return json as ApiResult<T>;
    }

    return networkError(
      502,
      "Recibimos una respuesta inesperada del servidor. Inténtalo de nuevo.",
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    return networkError(
      502,
      "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
    );
  }
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    apiRequest<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>("POST", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>("PATCH", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>("PUT", path, { ...options, body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "body">) =>
    apiRequest<T>("DELETE", path, options),
};
