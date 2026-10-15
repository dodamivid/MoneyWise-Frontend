import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Empty } from "@/components/states/empty";

export const metadata: Metadata = { title: "Tu perfil · MoneyWise" };

export default function PerfilPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Tu perfil"
        description="Tus datos y la seguridad de tu cuenta."
      />
      <Empty
        title="Estamos construyendo esta pantalla"
        description="Pronto podrás usarla desde aquí."
      />
    </div>
  );
}
