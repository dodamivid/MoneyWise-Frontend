import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { getSession } from "@/lib/auth/session";

export default async function ResumenPage() {
  const session = await getSession();

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col justify-center gap-4 px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Hola, {session?.nombre || "bienvenida o bienvenido"}
      </h1>
      <p className="text-muted-foreground">
        Aquí estará tu resumen del mes. Estamos construyendo esta pantalla.
      </p>
      <form action={logoutAction}>
        <Button type="submit" variant="outline">
          Cerrar sesión
        </Button>
      </form>
    </main>
  );
}
