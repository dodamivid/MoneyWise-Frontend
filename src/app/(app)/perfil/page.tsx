import type { Metadata } from "next";

import { PerfilView } from "@/components/perfil/perfil-view";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Tu perfil · MoneyWise" };

export default async function PerfilPage() {
  const session = await getSession();
  return <PerfilView usuarioId={Number(session?.sub)} />;
}
