import "server-only";

/**
 * Configuración del backend. Solo se importa desde el servidor: `server-only`
 * hace fallar el build si algún componente de cliente intenta importarla.
 * Ni la URL ni la key llevan `NEXT_PUBLIC_`, así que nunca viajan al navegador.
 */
export class ApiConfigError extends Error {}

export function getApiConfig(): { baseUrl: string; apiKey: string } {
  const baseUrl = process.env.API_BASE_URL?.trim().replace(/\/+$/, "");
  const apiKey = process.env.API_KEY?.trim();

  if (!baseUrl) {
    throw new ApiConfigError(
      "Falta API_BASE_URL. Cópiala de .env.example a .env.local.",
    );
  }
  if (!apiKey) {
    throw new ApiConfigError(
      "Falta API_KEY. Agrégala en .env.local (el valor está en Railway → Variables).",
    );
  }
  return { baseUrl, apiKey };
}
