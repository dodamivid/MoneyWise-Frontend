import type { Metadata } from "next";
import Link from "next/link";

import { RestablecerForm } from "@/components/auth/restablecer-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Nueva contraseña · MoneyWise" };

export default async function RestablecerPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={1} className="text-xl">
          Crea tu contraseña nueva
        </CardTitle>
        <CardDescription>
          {token
            ? "Elige una contraseña que no hayas usado antes."
            : "Este enlace no es válido. Pide uno nuevo para continuar."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {token ? (
          <RestablecerForm token={token} />
        ) : (
          <Link
            href="/olvido"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Pedir un enlace nuevo
          </Link>
        )}
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </CardFooter>
    </Card>
  );
}
