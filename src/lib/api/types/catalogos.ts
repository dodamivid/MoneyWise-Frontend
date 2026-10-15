import type { IsoDateTime } from "./common";

interface CatalogoBase {
  /** `null` = entrada global del sistema; si no, pertenece a la persona. */
  usuarioId: string | null;
  nombre: string;
  esPorDefecto: boolean;
  creadoEn: IsoDateTime;
  actualizadoEn: IsoDateTime;
}

/** GET /api/v1/catalogos/destinos */
export interface DestinoDTO extends CatalogoBase {
  destinoId: number;
}

/** GET /api/v1/catalogos/procedencias */
export interface ProcedenciaDTO extends CatalogoBase {
  procedenciaId: number;
}

/** GET /api/v1/catalogos/tipos-ingreso */
export interface TipoIngresoDTO extends CatalogoBase {
  tipoIngresoId: number;
}

/** GET /api/v1/catalogos/tipos-egreso */
export interface TipoEgresoDTO extends CatalogoBase {
  tipoEgresoId: number;
}

/**
 * GET /api/v1/catalogos/frecuencias. Catálogo global e inmutable: solo
 * administración lo modifica (Diario, Semanal, Quincenal, Mensual...).
 */
export interface FrecuenciaDTO {
  frecuenciaId: number;
  nombre: string;
  creadoEn: IsoDateTime;
  actualizadoEn: IsoDateTime;
}
