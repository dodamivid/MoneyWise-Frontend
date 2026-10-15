import type { IsoDateTime, PaginationQuery } from "./common";

/** GET /api/v1/metas */
export interface MetaDTO {
  metaId: number;
  usuarioId: number;
  nombre: string;
  montoObjetivo: number;
  ahorroReal: number;
  /** Lo calcula el backend: ahorroReal / montoObjetivo × 100 (puede pasar de 100). */
  porcentajeAvance: number;
  activa: boolean;
  fechaInicio: IsoDateTime;
  fechaFin?: IsoDateTime;
  creadoEn: IsoDateTime;
  actualizadoEn: IsoDateTime;
}

export interface ListarMetasQuery extends PaginationQuery {
  desde?: IsoDateTime;
  hasta?: IsoDateTime;
  activa?: boolean;
  orden?: string;
}

/**
 * POST /api/v1/metas. La documentación del backend marca `usuarioId` como
 * requerido. `nombre` de 1 a 120 caracteres; `montoObjetivo` > 0 con hasta 2
 * decimales. `ahorroReal` no se manda al crear: empieza en 0.
 */
export interface CrearMetaBody {
  usuarioId: number;
  nombre: string;
  montoObjetivo: number;
  fechaInicio: IsoDateTime;
  fechaFin?: IsoDateTime;
  activa?: boolean;
}

/**
 * PATCH /api/v1/metas/:id. Todos opcionales. `ahorroReal` no puede ser negativo
 * ni superar `montoObjetivo`. `DELETE` es un soft delete: deja `activa = false`.
 */
export type ActualizarMetaBody = Partial<Omit<CrearMetaBody, "usuarioId">> & {
  ahorroReal?: number;
};
