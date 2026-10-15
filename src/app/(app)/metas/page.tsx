import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Empty } from "@/components/states/empty";

export const metadata: Metadata = { title: "Metas · MoneyWise" };

export default function MetasPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Metas"
        description="Tus objetivos de ahorro y cómo avanzan."
      />
      <Empty
        title="Estamos construyendo esta pantalla"
        description="Pronto podrás usarla desde aquí."
      />
    </div>
  );
}
