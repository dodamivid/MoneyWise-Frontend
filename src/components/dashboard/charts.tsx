"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney } from "@/lib/format";

/**
 * Gráficas con Recharts. Los colores salen de los tokens de `globals.css`
 * (`--chart-*`), no se escriben a mano. Cada gráfica lleva una tabla
 * equivalente (`ChartDataTable`) para lectores de pantalla y para quien
 * prefiere leer los números.
 */

const AXIS = { fill: "var(--muted-foreground)", fontSize: 12 } as const;

function compactMoney(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

const tooltipStyle = {
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 13,
} as const;

export interface CategoriaDatum {
  nombre: string;
  total: number;
}

export function GastoPorCategoriaChart({ data }: { data: CategoriaDatum[] }) {
  const height = Math.max(180, data.length * 44 + 40);
  return (
    <div style={{ height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 8, right: 16 }}
          accessibilityLayer={false}
        >
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis
            type="number"
            tickFormatter={compactMoney}
            tick={AXIS}
            stroke="var(--border)"
          />
          <YAxis
            type="category"
            dataKey="nombre"
            width={96}
            tick={AXIS}
            stroke="var(--border)"
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value))}
            contentStyle={tooltipStyle}
            cursor={{ fill: "var(--muted)" }}
          />
          <Bar
            dataKey="total"
            name="Gasto"
            fill="var(--chart-1)"
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface MetaDatum {
  nombre: string;
  objetivo: number;
  ahorro: number;
}

export function MetasVsAhorroChart({ data }: { data: MetaDatum[] }) {
  return (
    <div style={{ height: 300 }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ left: 8, right: 8 }}
          accessibilityLayer={false}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="nombre" tick={AXIS} stroke="var(--border)" />
          <YAxis
            tickFormatter={compactMoney}
            tick={AXIS}
            stroke="var(--border)"
            width={64}
          />
          <Tooltip
            formatter={(value) => formatMoney(Number(value))}
            contentStyle={tooltipStyle}
            cursor={{ fill: "var(--muted)" }}
          />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Bar
            dataKey="objetivo"
            name="Objetivo"
            fill="var(--chart-5)"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="ahorro"
            name="Ahorrado"
            fill="var(--chart-2)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ChartDataTableProps {
  caption: string;
  headers: string[];
  rows: string[][];
}

/**
 * Los mismos datos de la gráfica, como tabla. Va dentro de un `<details>` para
 * que se abra con teclado y para no duplicar información a la vista.
 */
export function ChartDataTable({
  caption,
  headers,
  rows,
}: ChartDataTableProps) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer rounded-md py-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
        Ver los datos en una tabla
      </summary>
      <table className="mt-2 w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            {headers.map((header, index) => (
              <th
                key={header}
                scope="col"
                className={`py-1.5 font-medium ${index > 0 ? "text-right" : ""}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-b border-border/60">
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={`py-1.5 ${index > 0 ? "text-right tabular-nums" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
