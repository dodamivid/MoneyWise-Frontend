import type { IsoDateTime } from "./common";

/** GET /api/v1/metas */
export interface MetaDTO {
  metaId: number;
  usuarioId: number;
  nombre: string;
  montoObjetivo: number;
  ahorroReal: number;
  porcentajeAvance: number;
  activa: boolean;
  fechaInicio: IsoDateTime;
  fechaFin?: IsoDateTime;
  creadoEn: IsoDateTime;
  actualizadoEn: IsoDateTime;
}
