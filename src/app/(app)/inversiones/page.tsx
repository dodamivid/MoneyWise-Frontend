import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Empty } from "@/components/states/empty";

export const metadata: Metadata = { title: "Inversiones · MoneyWise" };

export default function InversionesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Inversiones"
        description="Dónde pones a trabajar tu dinero."
      />
      <Empty
        title="Estamos construyendo esta pantalla"
        description="Pronto podrás usarla desde aquí."
      />
    </div>
  );
}
