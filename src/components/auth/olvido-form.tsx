"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";

import { FormError } from "@/components/auth/form-error";
import { TextField } from "@/components/auth/text-field";
import { Button } from "@/components/ui/button";
import { olvidoAction, type ActionFailure } from "@/lib/auth/actions";
import { olvidoSchema, type OlvidoValues } from "@/lib/auth/schemas";

export function OlvidoForm() {
  const [failure, setFailure] = useState<ActionFailure>();
  const [sentTo, setSentTo] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OlvidoValues>({
    resolver: zodResolver(olvidoSchema),
    defaultValues: { correo: "" },
  });

  if (sentTo) {
    return (
      <div role="status" className="grid gap-3 text-center">
        <MailCheck className="mx-auto size-8 text-primary" aria-hidden="true" />
        <p className="font-medium">Revisa tu correo</p>
        <p className="text-sm text-muted-foreground">
          Si {sentTo} tiene una cuenta, te enviamos un enlace para crear una
          contraseña nueva. El enlace caduca en 15 minutos.
        </p>
      </div>
    );
  }

  const onSubmit = handleSubmit((values) => {
    setFailure(undefined);
    startTransition(async () => {
      const result = await olvidoAction(values);
      if (result.ok) setSentTo(values.correo);
      else setFailure(result);
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
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Enviando…" : "Enviar enlace"}
      </Button>
    </form>
  );
}
