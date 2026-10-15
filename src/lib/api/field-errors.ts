import type { ApiError } from "./envelope";

export interface FieldIssue {
  field: string;
  message: string;
}

/**
 * Saca los errores por campo de un `ApiError`. El backend los manda en dos
 * formas: la lista de issues de Zod (`[{ path: ["monto"], message }]`) y, en
 * usuarios, `{ errors: [{ field, message }] }`.
 */
export function extractFieldIssues(error: ApiError): FieldIssue[] {
  const raw = error.detalles;
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : raw &&
        typeof raw === "object" &&
        Array.isArray((raw as { errors?: unknown }).errors)
      ? (raw as { errors: unknown[] }).errors
      : [];

  const issues: FieldIssue[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const { path, field, message } = item as {
      path?: unknown;
      field?: unknown;
      message?: unknown;
    };
    if (typeof message !== "string") continue;
    const name =
      Array.isArray(path) && typeof path[0] === "string"
        ? path[0]
        : typeof field === "string"
          ? field
          : null;
    if (name) issues.push({ field: name, message });
  }
  return issues;
}
