import type { Metadata } from "next";

import { MetasView } from "@/components/metas/metas-view";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Metas · MoneyWise" };

export default async function MetasPage() {
  const session = await getSession();
  // El backend pide `usuarioId` al crear una meta; es el de la sesión.
  return <MetasView usuarioId={Number(session?.sub)} />;
}
