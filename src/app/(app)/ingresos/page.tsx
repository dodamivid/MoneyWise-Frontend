import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Empty } from "@/components/states/empty";

export const metadata: Metadata = { title: "Ingresos · MoneyWise" };

export default function IngresosPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Ingresos" description="Lo que entra a tu bolsillo." />
      <Empty
        title="Estamos construyendo esta pantalla"
        description="Pronto podrás usarla desde aquí."
      />
    </div>
  );
}
