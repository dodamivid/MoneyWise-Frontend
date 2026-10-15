import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Empty } from "@/components/states/empty";

export const metadata: Metadata = { title: "Fecha de corte · MoneyWise" };

export default function AhorroPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Fecha de corte"
        description="El día desde el que se calcula tu balance."
      />
      <Empty
        title="Estamos construyendo esta pantalla"
        description="Pronto podrás usarla desde aquí."
      />
    </div>
  );
}
