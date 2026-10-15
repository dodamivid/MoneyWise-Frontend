import type { Metadata } from "next";
import Link from "next/link";

import { RegistroForm } from "@/components/auth/registro-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Crear cuenta · MoneyWise" };

export default function RegistroPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={1} className="text-xl">
          Crea tu cuenta
        </CardTitle>
        <CardDescription>
          Registra tus ingresos y egresos y mira cómo vas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegistroForm />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <span>
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Iniciar sesión
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}
