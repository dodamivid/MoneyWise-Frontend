import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Empty } from "@/components/states/empty";

export const metadata: Metadata = { title: "Egresos · MoneyWise" };

export default function EgresosPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Egresos" description="Lo que sale de tu bolsillo." />
      <Empty
        title="Estamos construyendo esta pantalla"
        description="Pronto podrás usarla desde aquí."
      />
    </div>
  );
}
