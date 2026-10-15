import type { Metadata } from "next";

import { MovimientosView } from "@/components/movimientos/movimientos-view";

export const metadata: Metadata = { title: "Ingresos · MoneyWise" };

export default function IngresosPage() {
  return <MovimientosView kind="ingreso" />;
}
