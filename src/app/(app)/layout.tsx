import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

/**
 * Segunda barrera de las rutas privadas. `proxy.ts` ya redirige, pero aquí se
 * vuelve a verificar la sesión en el servidor: el proxy es solo optimista.
 * El layout con navegación se construye en el issue #5.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return <>{children}</>;
}
