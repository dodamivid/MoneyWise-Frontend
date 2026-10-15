import type { IsoDateTime } from "./common";

/** GET /api/v1/ahorro/fechas-corte */
export interface FechaCorteDTO {
  fechaCorteId: number;
  usuarioId: string;
  fechaCorte: IsoDateTime;
  creadoEn: IsoDateTime;
}

/** POST /api/v1/ahorro/fechas-corte */
export interface CrearFechaCorteBody {
  fechaCorte: IsoDateTime;
}
