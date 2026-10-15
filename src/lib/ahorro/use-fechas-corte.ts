"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { unwrap } from "@/lib/api/query";
import type { FechaCorteDTO } from "@/lib/api/types";

export interface FechaCorteRow {
  id: number;
  fechaCorte: string;
}

export const FECHAS_CORTE_PATH = "/v1/ahorro/fechas-corte";
export const FECHAS_CORTE_KEY = ["fechas-corte"] as const;

/** Fechas de corte de la persona, la más reciente primero. */
export function useFechasCorte() {
  return useQuery({
    queryKey: FECHAS_CORTE_KEY,
    queryFn: async ({ signal }) => {
      const { data } = await unwrap(
        api.get<FechaCorteDTO[]>(FECHAS_CORTE_PATH, {
          query: { pagina: 1, tamanoPagina: 100, orden: "fechaCorte:desc" },
          signal,
        }),
      );
      const rows: FechaCorteRow[] = [];
      for (const item of Array.isArray(data) ? data : []) {
        if (
          typeof item?.fechaCorteId === "number" &&
          typeof item.fechaCorte === "string"
        ) {
          rows.push({ id: item.fechaCorteId, fechaCorte: item.fechaCorte });
        }
      }
      return rows;
    },
  });
}
