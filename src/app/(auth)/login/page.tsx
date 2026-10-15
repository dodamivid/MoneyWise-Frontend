import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Iniciar sesión · MoneyWise" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registrado?: string }>;
}) {
  const { next, registrado } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={1} className="text-xl">
          Entra a tu cuenta
        </CardTitle>
        <CardDescription>
          {registrado
            ? "Tu cuenta está lista. Inicia sesión para continuar."
            : "Revisa cómo vas este mes."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm next={next} />
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <span>
          ¿Aún no tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Crear cuenta
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}
