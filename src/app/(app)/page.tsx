import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Empty } from "@/components/states/empty";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Resumen · MoneyWise" };

export default async function ResumenPage() {
  const session = await getSession();
  const nombre = session?.nombre?.trim();

  return (
    <div className="grid gap-6">
      <PageHeader
        title={nombre ? `Hola, ${nombre}` : "Resumen"}
        description="Así va tu mes."
      />
      <Empty
        title="Estamos construyendo esta pantalla"
        description="Aquí verás tu balance, tus ingresos y egresos y tus metas."
      />
    </div>
  );
}
