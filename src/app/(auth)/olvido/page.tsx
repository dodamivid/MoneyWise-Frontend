import type { Metadata } from "next";
import Link from "next/link";

import { OlvidoForm } from "@/components/auth/olvido-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Recuperar contraseña · MoneyWise" };

export default function OlvidoPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={1} className="text-xl">
          ¿Olvidaste tu contraseña?
        </CardTitle>
        <CardDescription>
          Escribe tu correo y te enviamos un enlace para crear una nueva.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OlvidoForm />
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
