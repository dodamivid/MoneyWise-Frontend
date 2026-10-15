import type { IsoDateTime, PaginationQuery } from "./common";

/** GET /api/v1/egresos */
export interface EgresoDTO {
  egresoId: number;
  usuarioId: number;
  tipoId: number;
  destinoId: number | null;
  monto: number;
  descripcion: string | null;
  fechaInicio: IsoDateTime;
  fechaFin: IsoDateTime | null;
  creadoEn: IsoDateTime;
  actualizadoEn: IsoDateTime;
}

/**
 * Filtros de GET /api/v1/egresos. Por confirmar al construir #8: el backend
 * valida con Zod en `src/dtos/egresos.dto.ts` y puede aceptar más filtros.
 */
export interface ListarEgresosQuery extends PaginationQuery {
  desde?: IsoDateTime;
  hasta?: IsoDateTime;
  tipoId?: number;
  destinoId?: number;
  orden?: string;
}
