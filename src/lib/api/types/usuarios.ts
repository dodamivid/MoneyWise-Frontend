import type { IsoDateTime } from "./common";

/** GET /api/users/:id */
export interface PerfilUsuarioDTO {
  usuarioId: number;
  nombre: string;
  apellidoP: string;
  apellidoM: string;
  correo: string;
  /** Formato YYYY-MM-DD. */
  fechaN: string;
  creadoEn: IsoDateTime;
  actualizadoEn: IsoDateTime;
  activo: boolean;
}

/** PUT /api/users/:id. Todos los campos son opcionales. */
export interface ActualizarPerfilBody {
  nombre?: string;
  apellidoP?: string;
  apellidoM?: string;
  fechaN?: string;
}
