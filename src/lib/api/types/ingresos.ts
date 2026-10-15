import type { IsoDateTime, PaginationQuery } from "./common";

/** GET /api/v1/ingresos */
export interface IngresoDTO {
  ingresoId: number;
  usuarioId: number;
  tipoId: number;
  procedenciaId: number | null;
  monto: number;
  descripcion: string | null;
  fechaInicio: IsoDateTime;
  fechaFin: IsoDateTime | null;
  creadoEn: IsoDateTime;
  actualizadoEn: IsoDateTime;
}

export interface ListarIngresosQuery extends PaginationQuery {
  desde?: IsoDateTime;
  hasta?: IsoDateTime;
  tipoId?: number;
  procedenciaId?: number;
  min?: number;
  max?: number;
  orden?:
    | "creadoEn"
    | "creadoEn:asc"
    | "creadoEn:desc"
    | "fechaInicio"
    | "fechaInicio:asc"
    | "fechaInicio:desc"
    | "monto"
    | "monto:asc"
    | "monto:desc";
}

/** POST /api/v1/ingresos. `monto` admite hasta 2 decimales. */
export interface CrearIngresoBody {
  tipoId: number;
  procedenciaId?: number | null;
  monto: number;
  descripcion?: string;
  fechaInicio: IsoDateTime;
  fechaFin?: IsoDateTime;
}

/** PATCH /api/v1/ingresos/:id. Debe incluir al menos un campo. */
export type ActualizarIngresoBody = Partial<
  Omit<CrearIngresoBody, "descripcion">
> & { descripcion?: string | null };
