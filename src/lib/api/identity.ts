import "server-only";

import { withMissingScopes } from "@/lib/api/scopes";
import { getSession } from "@/lib/auth/session";

/**
 * Identidad con la que el servidor habla con el backend.
 *
 * El backend confía en los headers `x-mw-user` y `x-mw-scopes` (autenticación
 * simulada). Por eso SOLO los fija el servidor, a partir de la cookie firmada
 * de sesión, y el proxy descarta cualquier header de este tipo que mande el
 * navegador.
 */
export interface BackendIdentity {
  userId: string;
  scopes: string[];
}

/** Identidad de la sesión actual, o `null` si no hay sesión vigente. */
export async function getBackendIdentity(): Promise<BackendIdentity | null> {
  const session = await getSession();
  if (!session) return null;
  return { userId: session.sub, scopes: withMissingScopes(session.scopes) };
}
