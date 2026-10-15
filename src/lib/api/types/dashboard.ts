import type { IsoDateTime } from "./common";

/** GET /api/v1/dashboard/resumen?desde=&hasta= (rango máximo ~12 meses) */
export interface DashboardResumenDTO {
  totales: { ingresos: number; egresos: number; balance: number };
  ingresosPorTipo: Array<{ tipoId: number; tipo: string; total: number }>;
  egresosPorTipo: Array<{ tipoId: number; tipo: string; total: number }>;
  ingresosPorProcedencia: Array<{
    procedenciaId: number;
    procedencia: string;
    total: number;
  }>;
  egresosPorDestino: Array<{
    destinoId: number;
    destino: string;
    total: number;
  }>;
}

/** GET /api/v1/dashboard/balance?fechaCorte= (depende de la fecha de corte) */
export interface DashboardBalanceDTO {
  fechaCorte: IsoDateTime;
  ingresosAcumulados: number;
  egresosAcumulados: number;
  balanceAcumulado: number;
}

/** GET /api/v1/dashboard/metas-vs-ahorro?desde=&hasta= */
export interface DashboardMetasDTO {
  metas: Array<{
    metaId: number;
    nombre: string;
    montoObjetivo: number;
    ahorroReal: number;
    porcentajeAvance: number;
  }>;
  resumen: {
    totalMetasActivas: number;
    ahorroTotalPeriodo: number;
    diferenciaObjetivo: number;
  };
}
