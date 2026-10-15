import type { Metadata } from "next";

import { MovimientosView } from "@/components/movimientos/movimientos-view";

export const metadata: Metadata = { title: "Egresos · MoneyWise" };

export default function EgresosPage() {
  return <MovimientosView kind="egreso" />;
}
