"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormError } from "@/components/auth/form-error";
import { TextField } from "@/components/auth/text-field";
import { Button } from "@/components/ui/button";
import { loginAction, type ActionFailure } from "@/lib/auth/actions";
import { loginSchema, type LoginValues } from "@/lib/auth/schemas";

export function LoginForm({ next }: { next?: string }) {
  const [failure, setFailure] = useState<ActionFailure>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { correo: "", contrasena: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setFailure(undefined);
    startTransition(async () => {
      const result = await loginAction(values, next);
      if (result) setFailure(result);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      {failure ? (
        <FormError mensaje={failure.mensaje} traceId={failure.traceId} />
      ) : null}
      <TextField
        id="correo"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.correo?.message}
        {...register("correo")}
      />
      <TextField
        id="contrasena"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        error={errors.contrasena?.message}
        {...register("contrasena")}
      />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Iniciando sesión…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
