import { describe, expect, it } from "vitest";

import {
  dateInputToIso,
  formatDate,
  formatDateShort,
  formatMoney,
  formatPercent,
  formatSignedMoney,
  isoToDateInput,
  monthRangeIso,
} from "./format";

describe("formatMoney", () => {
  it("da formato MXN con miles y dos decimales", () => {
    expect(formatMoney(1234.5)).toBe("$1,234.50");
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("agrega el código cuando se pide", () => {
    expect(formatMoney(1234.5, { withCode: true })).toBe("$1,234.50 MXN");
  });

  it("devuelve un guion si el valor no es un número", () => {
    expect(formatMoney(null)).toBe("—");
    expect(formatMoney(undefined)).toBe("—");
    expect(formatMoney("abc")).toBe("—");
  });
});

describe("formatSignedMoney", () => {
  it("pone + a los ingresos y − a los egresos", () => {
    expect(formatSignedMoney(20000, "ingreso")).toBe("+$20,000.00");
    expect(formatSignedMoney(6500, "egreso")).toBe("−$6,500.00");
  });

  it("no duplica el signo si el monto ya viene negativo", () => {
    expect(formatSignedMoney(-6500, "egreso")).toBe("−$6,500.00");
  });
});

describe("fechas en hora de Ciudad de México", () => {
  it("formatea una fecha ISO con Z", () => {
    expect(formatDate("2026-08-05T18:00:00Z")).toBe("5 de agosto de 2026");
    expect(formatDateShort("2026-08-05T18:00:00Z")).toBe("5 ago 2026");
  });

  it("una medianoche UTC cae en el día anterior en México", () => {
    expect(formatDate("2026-08-05T00:00:00.000Z")).toBe("4 de agosto de 2026");
  });

  it("una fecha inválida devuelve un guion", () => {
    expect(formatDate("no es fecha")).toBe("—");
    expect(formatDate(null)).toBe("—");
  });
});

describe("dateInputToIso / isoToDateInput", () => {
  it("manda las 12:00 de México para que la fecha no se corra de día", () => {
    const iso = dateInputToIso("2026-08-05");
    expect(iso).toBe("2026-08-05T18:00:00.000Z");
    expect(formatDate(iso)).toBe("5 de agosto de 2026");
    expect(isoToDateInput(iso)).toBe("2026-08-05");
  });

  it("rechaza formatos y fechas imposibles", () => {
    expect(dateInputToIso("05/08/2026")).toBeNull();
    expect(dateInputToIso("2026-02-31")).toBeNull();
  });
});

describe("monthRangeIso", () => {
  it("cubre del primer al último instante del mes en México", () => {
    const { desde, hasta, label } = monthRangeIso(
      new Date("2026-10-15T18:00:00Z"),
    );
    expect(desde).toBe("2026-10-01T06:00:00.000Z");
    expect(hasta).toBe("2026-11-01T05:59:59.999Z");
    expect(label).toBe("octubre de 2026");
  });

  it("usa el mes de México aunque en UTC ya sea el siguiente", () => {
    // 1 de noviembre 02:00 UTC = 31 de octubre 20:00 en México.
    const { label } = monthRangeIso(new Date("2026-11-01T02:00:00Z"));
    expect(label).toBe("octubre de 2026");
  });
});

describe("formatPercent", () => {
  it("redondea al entero", () => {
    expect(formatPercent(59.6)).toBe("60 %");
    expect(formatPercent(null)).toBe("—");
  });
});
