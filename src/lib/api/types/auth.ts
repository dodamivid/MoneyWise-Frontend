import type { IsoDateTime } from "./common";

/**
 * Tipos de autenticación. Los atiende el servidor (issue #4): el token nunca
 * llega al navegador, por eso no hay llamadas de `auth` en el cliente.
 */
export interface RegistroBody {
  nombre: string;
  apellidoP: string;
  apellidoM: string;
  correo: string;
  /** YYYY-MM-DD. Debe ser mayor de 16 años. */
  fechaN: string;
  /** Mínimo 8 caracteres, con mayúscula, minúscula y dígito. */
  contrasena: string;
}

export interface AccesoBody {
  correo: string;
  contrasena: string;
}

export interface RegistroData {
  usuarioId: number;
  nombreCompleto: string;
  correo: string;
  creadoEn: IsoDateTime;
  scopes: string[];
}

export interface AccesoData {
  token: string;
  refreshToken?: string;
  expiraEn: number;
  usuario: {
    usuarioId: number;
    nombre: string;
    correo: string;
    scopes: string[];
  };
}

export interface OlvidoBody {
  correo: string;
}

export interface RestablecerBody {
  token: string;
  contrasenaNueva: string;
}
