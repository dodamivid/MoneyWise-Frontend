import { NextResponse, type NextRequest } from "next/server";

import { callBackend, resolveBackendPath } from "@/lib/api/backend";
import { getBackendIdentity } from "@/lib/api/identity";
import { networkError, type ApiResult } from "@/lib/api/envelope";

/**
 * Proxy hacia el backend de Railway.
 *
 * El navegador llama a `/api/mw/...` y este handler agrega la `x-api-key` y la
 * identidad de sesión. No reenvía ningún header del cliente: así nadie puede
 * colar `x-api-key`, `x-mw-user` ni `x-mw-scopes`.
 */
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 1_000_000;

type RouteContext = { params: Promise<{ path: string[] }> };

function respond(result: ApiResult<unknown>) {
  const status = result.ok ? result.status : result.error.status;
  const traceId = result.ok ? result.traceId : result.error.traceId;
  return NextResponse.json(result, {
    status,
    headers: {
      "cache-control": "no-store",
      ...(traceId ? { "x-trace-id": traceId } : {}),
    },
  });
}

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const backendPath = resolveBackendPath(path);

  if (!backendPath) {
    return respond({
      ok: false,
      error: {
        status: 404,
        mensaje: "Esta ruta no existe.",
        codigo: "RUTA_NO_PERMITIDA",
      },
    });
  }

  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "DELETE") {
    body = await request.text();
    if (body.length > MAX_BODY_BYTES) {
      return respond(networkError(502, "La petición es demasiado grande."));
    }
    if (body === "") body = undefined;
  }

  // Solo /health es público. Todo lo demás exige una sesión vigente: sin ella,
  // el backend atendería la petición como su usuario por defecto (`demo-user`).
  const identity = await getBackendIdentity();
  if (!identity && backendPath !== "/health") {
    return respond({
      ok: false,
      error: {
        status: 401,
        mensaje: "Tu sesión terminó. Inicia sesión de nuevo para continuar.",
        codigo: "SIN_SESION",
      },
    });
  }

  const result = await callBackend({
    method: request.method,
    path: backendPath,
    search: request.nextUrl.search,
    body,
    identity,
  });

  return respond(result);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
