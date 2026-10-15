import type { ApiError, ApiMeta, ApiResult } from "./envelope";

/**
 * Error que lanzan las queries de TanStack Query. Conserva el `ApiError`
 * completo (mensaje, código y `traceId`) para mostrarlo en `ErrorState`.
 */
export class ApiRequestError extends Error {
  readonly error: ApiError;

  constructor(error: ApiError) {
    super(error.mensaje);
    this.name = "ApiRequestError";
    this.error = error;
  }
}

/**
 * Convierte un `ApiResult` en datos o en una excepción, que es lo que espera
 * `useQuery`. Devuelve `data` y `meta` (paginación) juntos.
 */
export async function unwrap<T>(
  request: Promise<ApiResult<T>>,
): Promise<{ data: T; meta?: ApiMeta }> {
  const result = await request;
  if (!result.ok) throw new ApiRequestError(result.error);
  return { data: result.data, meta: result.meta };
}

/** Saca el `ApiError` de lo que devuelva una query, o inventa uno genérico. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiRequestError) return error.error;
  return {
    status: 500,
    mensaje:
      "No pudimos completar la operación. Inténtalo de nuevo en unos minutos.",
  };
}
