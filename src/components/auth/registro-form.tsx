"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormError } from "@/components/auth/form-error";
import { TextField } from "@/components/auth/text-field";
import { Button } from "@/components/ui/button";
import { registroAction, type ActionFailure } from "@/lib/auth/actions";
import { registroSchema, type RegistroValues } from "@/lib/auth/schemas";

export function RegistroForm() {
  const [failure, setFailure] = useState<ActionFailure>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegistroValues>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      nombre: "",
      apellidoP: "",
      apellidoM: "",
      correo: "",
      fechaN: "",
      contrasena: "",
      confirmarContrasena: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFailure(undefined);
    startTransition(async () => {
      const result = await registroAction(values);
      if (!result) return;
      setFailure(result);
      for (const [campo, mensaje] of Object.entries(result.campos ?? {})) {
        if (mensaje)
          setError(campo as keyof RegistroValues, { message: mensaje });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      {failure ? (
        <FormError mensaje={failure.mensaje} traceId={failure.traceId} />
      ) : null}
      <TextField
        id="nombre"
        label="Nombre"
        autoComplete="given-name"
        error={errors.nombre?.message}
        {...register("nombre")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="apellidoP"
          label="Apellido paterno"
          autoComplete="family-name"
          error={errors.apellidoP?.message}
          {...register("apellidoP")}
        />
        <TextField
          id="apellidoM"
          label="Apellido materno"
          error={errors.apellidoM?.message}
          {...register("apellidoM")}
        />
      </div>
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
        id="fechaN"
        label="Fecha de nacimiento"
        type="date"
        autoComplete="bday"
        error={errors.fechaN?.message}
        {...register("fechaN")}
      />
      <TextField
        id="contrasena"
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres, con una mayúscula, una minúscula y un número."
        error={errors.contrasena?.message}
        {...register("contrasena")}
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
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}
