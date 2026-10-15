import type { IsoDateTime, PaginationQuery } from "./common";

/** GET /api/v1/inversiones */
export interface InversionDTO {
  inversionId: number;
  usuarioId: number;
  destinoId: number | null;
  monto: number;
  objetivo: string;
  fechaInicio: IsoDateTime;
  fechaFin: IsoDateTime | null;
  /** Porcentaje de 0 a 100. */
  tasaInteresPorc: number;
  creadoEn: IsoDateTime;
  actualizadoEn: IsoDateTime;
}

export interface ListarInversionesQuery extends PaginationQuery {
  desde?: IsoDateTime;
  hasta?: IsoDateTime;
  orden?: string;
}

/** POST /api/v1/inversiones. `monto` > 0 y `objetivo` hasta 120 caracteres. */
export interface CrearInversionBody {
  destinoId?: number | null;
  monto: number;
  objetivo: string;
  fechaInicio: IsoDateTime;
  fechaFin?: IsoDateTime | null;
  tasaInteresPorc: number;
}

export type ActualizarInversionBody = Partial<CrearInversionBody>;
