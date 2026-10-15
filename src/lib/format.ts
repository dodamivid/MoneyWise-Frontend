/**
 * Formato de dinero y fechas.
 *
 * - Dinero siempre en MXN, con separador de miles y 2 decimales.
 * - El backend manda fechas ISO con `Z` (UTC). Se muestran en hora de Ciudad de
 *   México. Se fija la zona en lugar de usar la del entorno para que el
 *   servidor (UTC en Vercel) y el navegador pinten lo mismo y no haya errores
 *   de hidratación. Se puede cambiar con `timeZone`.
 */

export const DEFAULT_TIME_ZONE = "America/Mexico_City";
const LOCALE = "es-MX";

const moneyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface MoneyOptions {
  /** Agrega el código: "$1,234.50 MXN". Útil donde el contexto no lo deja claro. */
  withCode?: boolean;
}

/** `1234.5` → `$1,234.50`. Un valor no numérico devuelve `—`. */
export function formatMoney(
  value: number | string | null | undefined,
  { withCode = false }: MoneyOptions = {},
): string {
  const amount = typeof value === "string" ? Number(value) : value;
  if (amount === null || amount === undefined || !Number.isFinite(amount)) {
    return "—";
  }
  const text = moneyFormatter.format(amount);
  return withCode ? `${text} MXN` : text;
}

/**
 * Monto con signo explícito: `+$1,234.50` (ingreso) o `−$1,234.50` (egreso).
 * El signo evita depender solo del color para distinguir el tipo.
 */
export function formatSignedMoney(
  value: number | string | null | undefined,
  kind: "ingreso" | "egreso",
  options?: MoneyOptions,
): string {
  const text = formatMoney(
    typeof value === "string"
      ? Math.abs(Number(value))
      : value && Math.abs(value),
    options,
  );
  if (text === "—") return text;
  return `${kind === "ingreso" ? "+" : "−"}${text}`;
}

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateFormatter(
  options: Intl.DateTimeFormatOptions,
  timeZone: string,
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(LOCALE, { timeZone, ...options });
}

/** `2026-08-05T18:00:00Z` → `5 de agosto de 2026`. Inválida → `—`. */
export function formatDate(
  value: DateInput,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  const date = toDate(value);
  if (!date) return "—";
  return dateFormatter(
    { day: "numeric", month: "long", year: "numeric" },
    timeZone,
  ).format(date);
}

/** Versión corta para tablas y móvil: `5 ago 2026`. */
export function formatDateShort(
  value: DateInput,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  const date = toDate(value);
  if (!date) return "—";
  return dateFormatter(
    { day: "numeric", month: "short", year: "numeric" },
    timeZone,
  )
    .format(date)
    .replace(/\./g, "");
}

/** `5 de agosto de 2026, 12:30`. */
export function formatDateTime(
  value: DateInput,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  const date = toDate(value);
  if (!date) return "—";
  return dateFormatter(
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
    timeZone,
  ).format(date);
}

/**
 * Convierte la fecha de un `<input type="date">` (`2026-08-05`) al ISO que
 * espera el backend, a las 12:00 de Ciudad de México (`...T18:00:00.000Z`).
 *
 * Se usa mediodía y no medianoche porque `2026-08-05T00:00:00Z` es el 4 de
 * agosto a las 18:00 en México: la fecha se vería un día antes.
 * Ciudad de México está en UTC−6 todo el año (sin horario de verano).
 */
export function dateInputToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00-06:00`);
  if (Number.isNaN(date.getTime())) return null;
  // `2026-02-31` no falla en Date: se recorre a marzo. Se rechaza si no regresa igual.
  if (isoToDateInput(date) !== value) return null;
  return date.toISOString();
}

/** Inverso de `dateInputToIso`: ISO → `2026-08-05` para rellenar un input date. */
export function isoToDateInput(
  value: DateInput,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  const date = toDate(value);
  if (!date) return "";
  // `en-CA` formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Primer y último instante del mes en hora de Ciudad de México, como ISO.
 * `now` se puede inyectar para pruebas.
 */
export function monthRangeIso(now: Date = new Date()): {
  desde: string;
  hasta: string;
  label: string;
} {
  const [year, month] = isoToDateInput(now).split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const desde = new Date(`${year}-${pad(month)}-01T00:00:00-06:00`);
  const hasta = new Date(
    `${year}-${pad(month)}-${pad(lastDay)}T23:59:59.999-06:00`,
  );
  const label = new Intl.DateTimeFormat(LOCALE, {
    timeZone: DEFAULT_TIME_ZONE,
    month: "long",
    year: "numeric",
  }).format(now);
  return { desde: desde.toISOString(), hasta: hasta.toISOString(), label };
}

/** Porcentaje entero: `60` → `60 %`. */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return `${Math.round(value)} %`;
}
