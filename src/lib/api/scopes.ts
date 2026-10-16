/**
 * Scopes que el registro del backend no concede a los usuarios nuevos.
 *
 * `sp_usuarios_registrar` da scopes de ingresos, egresos, metas, inversiones,
 * catálogos y dashboard, pero no estos:
 * - `ahorro:*`: sin ellos `/ahorro/fechas-corte` responde 403 y el balance
 *   nunca tiene fecha de corte (404).
 * - `usuarios:*`: sin ellos el perfil responde 403. El backend ya limita estas
 *   rutas al propio usuario (`requireUserOwnership`), salvo `admin:usuarios`.
 *
 * El backend lo usan otros proyectos y no se modifica, así que el servidor del
 * front los agrega a la identidad que manda. Los headers los fija el servidor
 * a partir de la sesión y el proxy descarta los del navegador. Si el backend
 * corrige el registro, este archivo y su uso en `identity.ts` se pueden borrar.
 */
export const MISSING_SCOPES = [
  "ahorro:leer",
  "ahorro:escribir",
  "usuarios:leer",
  "usuarios:escribir",
] as const;

/**
 * El listado de metas del backend filtra por `usuarioId` y, sin él, devuelve
 * una lista vacía (`sp_metas_listar` exige `usuario_id = ?`). El proxy lo fija
 * con el usuario de la sesión y descarta el que mande el navegador, así nadie
 * puede pedir las metas de otra persona.
 */
export function scopeSearchToUser(
  method: string,
  backendPath: string,
  search: string,
  userId: string,
): string {
  const isMetasList =
    method === "GET" && backendPath.replace(/\/+$/, "") === "/api/v1/metas";
  if (!isMetasList) return search;
  const params = new URLSearchParams(search);
  params.set("usuarioId", userId);
  return `?${params.toString()}`;
}

const METAS_ITEM_PATH = /^\/api\/v1\/metas\/\d+\/?$/;

/**
 * `DELETE /v1/metas/:id` exige `usuarioId` en el body (el backend aún no lo
 * saca de la sesión) y responde 500 sin él. El proxy lo manda con el usuario de
 * la sesión; el `sp_metas_eliminar` solo borra metas de ese usuario.
 */
export function bodyForUser(
  method: string,
  backendPath: string,
  userId: string,
): string | undefined {
  if (method !== "DELETE" || !METAS_ITEM_PATH.test(backendPath)) {
    return undefined;
  }
  return JSON.stringify({ usuarioId: Number(userId) });
}

/** Devuelve `scopes` más los de `MISSING_SCOPES` que falten, sin duplicar ni mutar. */
export function withMissingScopes(scopes: readonly string[]): string[] {
  const result = [...scopes];
  for (const scope of MISSING_SCOPES) {
    if (!result.includes(scope)) result.push(scope);
  }
  return result;
}
