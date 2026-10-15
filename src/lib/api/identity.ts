import "server-only";

/**
 * Identidad con la que el servidor habla con el backend.
 *
 * El backend confía en los headers `x-mw-user` y `x-mw-scopes` (autenticación
 * simulada). Por eso SOLO los fija el servidor, a partir de la sesión, y el
 * proxy descarta cualquier header de este tipo que mande el navegador.
 */
export interface BackendIdentity {
  userId: string;
  scopes: string[];
}

/**
 * Devuelve la identidad de la sesión actual o `null` si no hay sesión.
 *
 * TODO(#4): leer la cookie httpOnly de sesión y devolver { userId, scopes }.
 * Mientras no exista sesión, el backend usa su usuario por defecto
 * (`demo-user`), así que las rutas privadas deben protegerse con el middleware
 * del issue #4 antes de exponer datos reales.
 */
export async function getBackendIdentity(): Promise<BackendIdentity | null> {
  return null;
}
