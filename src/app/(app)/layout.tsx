import { redirect } from "next/navigation";

import { AppNav } from "@/components/layout/app-nav";
import { QueryProvider } from "@/components/providers/query-provider";
import { getSession } from "@/lib/auth/session";

/**
 * Layout de las pantallas privadas: navegación lateral en escritorio y barra
 * inferior en móvil. También es la segunda barrera de acceso: `proxy.ts` ya
 * redirige, pero aquí se vuelve a verificar la sesión en el servidor.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-svh">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-lg bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <AppNav user={{ nombre: session.nombre, correo: session.correo }} />
      <main
        id="contenido"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl px-4 pt-6 pb-28 outline-none md:pt-10 md:pr-8 md:pb-10 md:pl-[calc(16rem+2rem)]"
      >
        <QueryProvider>{children}</QueryProvider>
      </main>
    </div>
  );
}
