"use client";

import { useQuery } from "@tanstack/react-query";

import { useFechasCorte } from "@/lib/ahorro/use-fechas-corte";
import { api } from "@/lib/api/client";
import { unwrap } from "@/lib/api/query";
import type {
  DashboardBalanceDTO,
  DashboardMetasDTO,
  DashboardResumenDTO,
} from "@/lib/api/types";
import {
  toRow,
  MOVIMIENTOS,
  type MovimientoKind,
} from "@/lib/movimientos/config";

// `type` y no `interface`: un alias es asignable a los parámetros de consulta.
export type Range = {
  desde: string;
  hasta: string;
};

/** Resumen de ingresos y egresos del periodo, con desglose por categoría. */
export function useResumen(range: Range) {
  return useQuery({
    queryKey: ["dashboard", "resumen", range.desde, range.hasta],
    queryFn: async ({ signal }) =>
      (
        await unwrap(
          api.get<DashboardResumenDTO>("/v1/dashboard/resumen", {
            // Solo desde y hasta: el rango puede traer más campos (label).
            query: { desde: range.desde, hasta: range.hasta },
            signal,
          }),
        )
      ).data,
  });
}

/**
 * Balance acumulado desde la fecha de corte. No se pide si todavía no hay una
 * fecha registrada: sin ella el backend no tiene desde dónde calcular.
 */
export function useBalance() {
  const fechas = useFechasCorte();
  const hasCorte = fechas.isSuccess && fechas.data.length > 0;

  const balance = useQuery({
    queryKey: ["dashboard", "balance", fechas.data?.[0]?.fechaCorte],
    enabled: hasCorte,
    queryFn: async ({ signal }) =>
      (
        await unwrap(
          api.get<DashboardBalanceDTO | null>("/v1/dashboard/balance", {
            signal,
          }),
        )
      ).data,
  });

  return {
    /** Todavía no se sabe si hay fecha de corte. */
    isCheckingCorte: fechas.isPending,
    corteError: fechas.isError ? fechas.error : null,
    refetchCorte: fechas.refetch,
    /** Se confirmó que no hay fecha de corte registrada. */
    needsCorte: fechas.isSuccess && fechas.data.length === 0,
    balance,
  };
}

/** Metas activas contra lo ahorrado en el periodo. */
export function useMetasVsAhorro(range: Range) {
  return useQuery({
    queryKey: ["dashboard", "metas", range.desde, range.hasta],
    queryFn: async ({ signal }) =>
      (
        await unwrap(
          api.get<DashboardMetasDTO>("/v1/dashboard/metas-vs-ahorro", {
            // Solo desde y hasta: el rango puede traer más campos (label).
            query: { desde: range.desde, hasta: range.hasta },
            signal,
          }),
        )
      ).data,
  });
}

export interface Reciente {
  key: string;
  kind: MovimientoKind;
  descripcion: string | null;
  tipoId: number;
  monto: number;
  fechaInicio: string;
}

/** Los últimos movimientos, mezclando ingresos y egresos por fecha. */
export function useRecientes(limit = 5) {
  return useQuery({
    queryKey: ["dashboard", "recientes", limit],
    queryFn: async ({ signal }): Promise<Reciente[]> => {
      const kinds: MovimientoKind[] = ["ingreso", "egreso"];
      const results = await Promise.all(
        kinds.map(async (kind) => {
          const config = MOVIMIENTOS[kind];
          const { data } = await unwrap(
            api.get<Record<string, unknown>[]>(config.path, {
              query: {
                pagina: 1,
                tamanoPagina: limit,
                orden: "fechaInicio:desc",
              },
              signal,
            }),
          );
          return (Array.isArray(data) ? data : []).flatMap((raw) => {
            const row = toRow(raw, config);
            return row
              ? [
                  {
                    key: `${kind}-${row.id}`,
                    kind,
                    descripcion: row.descripcion,
                    tipoId: row.tipoId,
                    monto: row.monto,
                    fechaInicio: row.fechaInicio,
                  },
                ]
              : [];
          });
        }),
      );
      return results
        .flat()
        .sort((a, b) => Date.parse(b.fechaInicio) - Date.parse(a.fechaInicio))
        .slice(0, limit);
    },
  });
}
