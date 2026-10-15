import type { Metadata } from "next";

import { FechasCorteView } from "@/components/ahorro/fechas-corte-view";

export const metadata: Metadata = { title: "Fecha de corte · MoneyWise" };

export default function AhorroPage() {
  return <FechasCorteView />;
}
