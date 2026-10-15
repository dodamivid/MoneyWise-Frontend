/** Fecha y hora ISO-8601 con `Z` (UTC). Se muestra siempre en hora local. */
export type IsoDateTime = string;

/** Parámetros de paginación que aceptan todas las listas del backend. */
export interface PaginationQuery {
  pagina?: number;
  /** Máximo 100. Por defecto 20. */
  tamanoPagina?: number;
}

/** Respuesta de un alta: el backend devuelve solo el id creado. */
export type Created<K extends string> = { [P in K]: number };

export interface Updated {
  actualizado: boolean;
}

export interface Deleted {
  eliminado: boolean;
}
