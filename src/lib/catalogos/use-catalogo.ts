"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { toApiError, unwrap } from "@/lib/api/query";
import type { ApiError } from "@/lib/api/envelope";

/**
 * Los cinco catálogos del backend. Cada uno tiene su ruta y el nombre de su
 * campo de id (no son uniformes: `destinoId`, `tipoIngresoId`, ...).
 */
export const CATALOGOS = {
  destinos: { path: "/v1/catalogos/destinos", idField: "destinoId" },
  procedencias: {
    path: "/v1/catalogos/procedencias",
    idField: "procedenciaId",
  },
  "tipos-ingreso": {
    path: "/v1/catalogos/tipos-ingreso",
    idField: "tipoIngresoId",
  },
  "tipos-egreso": {
    path: "/v1/catalogos/tipos-egreso",
    idField: "tipoEgresoId",
  },
  frecuencias: {
    path: "/v1/catalogos/frecuencias",
    idField: "frecuenciaId",
  },
} as const;

export type CatalogoKey = keyof typeof CATALOGOS;

export interface CatalogoOption {
  value: number;
  label: string;
}

type CatalogoRow = Record<string, unknown>;

function toOptions(rows: CatalogoRow[], idField: string): CatalogoOption[] {
  const options: CatalogoOption[] = [];
  for (const row of rows) {
    const value = row[idField];
    const label = row.nombre;
    if (typeof value === "number" && typeof label === "string") {
      options.push({ value, label });
    }
  }
  return options;
}

/**
 * Carga un catálogo y lo deja como opciones `{ value, label }`.
 * El caché de TanStack Query evita volver a pedirlo en cada formulario.
 */
export function useCatalogo(key: CatalogoKey) {
  const { path, idField } = CATALOGOS[key];

  const query = useQuery({
    queryKey: ["catalogo", key],
    // Los catálogos casi no cambian: se conservan 10 minutos.
    staleTime: 10 * 60_000,
    queryFn: async ({ signal }) => {
      const { data } = await unwrap(
        api.get<CatalogoRow[]>(path, {
          // 100 es el máximo del backend; ningún catálogo se le acerca.
          query: { pagina: 1, tamanoPagina: 100, orden: "nombre:asc" },
          signal,
        }),
      );
      return toOptions(Array.isArray(data) ? data : [], idField);
    },
  });

  const error: ApiError | undefined = query.error
    ? toApiError(query.error)
    : undefined;

  return {
    options: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    error,
    refetch: query.refetch,
  };
}
