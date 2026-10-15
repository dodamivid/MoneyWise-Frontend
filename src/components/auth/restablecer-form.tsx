"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck } from "lucide-react";
import { useForm } from "react-hook-form";

import { FormError } from "@/components/auth/form-error";
import { TextField } from "@/components/auth/text-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { restablecerAction, type ActionFailure } from "@/lib/auth/actions";
import { restablecerSchema, type RestablecerValues } from "@/lib/auth/schemas";

export function RestablecerForm({ token }: { token: string }) {
  const [failure, setFailure] = useState<ActionFailure>();
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RestablecerValues>({
    resolver: zodResolver(restablecerSchema),
    defaultValues: { contrasenaNueva: "", confirmarContrasena: "" },
  });

  if (done) {
    return (
      <div role="status" className="grid gap-4 text-center">
        <CircleCheck
          className="mx-auto size-8 text-ingreso"
          aria-hidden="true"
        />
        <p className="font-medium">Contraseña actualizada</p>
        <p className="text-sm text-muted-foreground">
          Ya puedes entrar con tu contraseña nueva.
        </p>
        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const onSubmit = handleSubmit((values) => {
    setFailure(undefined);
    startTransition(async () => {
      const result = await restablecerAction(token, values);
      if (result.ok) setDone(true);
      else setFailure(result);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      {failure ? (
        <FormError mensaje={failure.mensaje} traceId={failure.traceId} />
      ) : null}
      <TextField
        id="contrasenaNueva"
        label="Contraseña nueva"
        type="password"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres, con una mayúscula, una minúscula y un número."
        error={errors.contrasenaNueva?.message}
        {...register("contrasenaNueva")}
      />
      <TextField
        id="confirmarContrasena"
        label="Repite tu contraseña"
        type="password"
        autoComplete="new-password"
        error={errors.confirmarContrasena?.message}
        {...register("confirmarContrasena")}
      />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}
