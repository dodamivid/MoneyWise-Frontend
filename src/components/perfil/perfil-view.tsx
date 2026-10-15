"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { FormError } from "@/components/auth/form-error";
import { TextField } from "@/components/auth/text-field";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState } from "@/components/states/error-state";
import { Loading } from "@/components/states/loading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/envelope";
import { extractFieldIssues } from "@/lib/api/field-errors";
import { toApiError, unwrap } from "@/lib/api/query";
import type { PerfilUsuarioDTO } from "@/lib/api/types";
import { actualizarNombreSesionAction, logoutAction } from "@/lib/auth/actions";
import {
  cambioContrasenaSchema,
  perfilSchema,
  type CambioContrasenaValues,
  type PerfilValues,
} from "@/lib/auth/schemas";

function perfilPath(usuarioId: number) {
  return `/users/${usuarioId}`;
}

function PerfilForm({
  perfil,
  usuarioId,
}: {
  perfil: PerfilUsuarioDTO;
  usuarioId: number;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [failure, setFailure] = useState<ApiError>();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<PerfilValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nombre: perfil.nombre,
      apellidoP: perfil.apellidoP,
      apellidoM: perfil.apellidoM,
      // El backend puede mandar la fecha completa; el input solo quiere el día.
      fechaN: perfil.fechaN.slice(0, 10),
    },
  });

  const mutation = useMutation({
    mutationFn: (values: PerfilValues) =>
      unwrap(api.put(perfilPath(usuarioId), values)),
    onSuccess: async (_data, values) => {
      await queryClient.invalidateQueries({ queryKey: ["perfil"] });
      await actualizarNombreSesionAction(values.nombre);
      reset(values);
      setSaved(true);
      router.refresh();
    },
    onError: (error) => {
      const apiError = toApiError(error);
      setFailure(apiError);
      for (const issue of extractFieldIssues(apiError)) {
        if (
          ["nombre", "apellidoP", "apellidoM", "fechaN"].includes(issue.field)
        ) {
          setError(issue.field as keyof PerfilValues, {
            message: issue.message,
          });
        }
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2} className="text-xl">
          Tus datos
        </CardTitle>
        <CardDescription>
          Tu correo es tu usuario y no se puede cambiar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit((values) => {
            setFailure(undefined);
            setSaved(false);
            mutation.mutate(values);
          })}
        >
          {failure ? (
            <FormError mensaje={failure.mensaje} traceId={failure.traceId} />
          ) : null}
          {saved ? (
            <p
              role="status"
              className="rounded-lg border border-border bg-muted px-3 py-2 text-sm"
            >
              Cambios guardados.
            </p>
          ) : null}
          <TextField
            id="correo"
            label="Correo electrónico"
            value={perfil.correo}
            readOnly
            disabled
          />
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
            id="fechaN"
            label="Fecha de nacimiento"
            type="date"
            autoComplete="bday"
            error={errors.fechaN?.message}
            {...register("fechaN")}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending || !isDirty}>
              {mutation.isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ContrasenaForm({ usuarioId }: { usuarioId: number }) {
  const [failure, setFailure] = useState<ApiError>();
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<CambioContrasenaValues>({
    resolver: zodResolver(cambioContrasenaSchema),
    defaultValues: {
      contrasenaActual: "",
      contrasenaNueva: "",
      confirmarContrasena: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: CambioContrasenaValues) =>
      unwrap(
        api.patch(`${perfilPath(usuarioId)}/contrasena`, {
          contrasenaActual: values.contrasenaActual,
          contrasenaNueva: values.contrasenaNueva,
        }),
      ),
    onSuccess: () => {
      reset();
      setSaved(true);
    },
    onError: (error) => {
      const apiError = toApiError(error);
      // 401: la contraseña actual no coincide. Es un error del campo, no de la sesión.
      if (apiError.status === 401) {
        setError("contrasenaActual", {
          message: "La contraseña actual no es correcta.",
        });
        return;
      }
      setFailure(apiError);
      for (const issue of extractFieldIssues(apiError)) {
        if (
          issue.field === "contrasenaNueva" ||
          issue.field === "contrasenaActual"
        ) {
          setError(issue.field, { message: issue.message });
        }
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle role="heading" aria-level={2} className="text-xl">
          Seguridad
        </CardTitle>
        <CardDescription>Cambia tu contraseña.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="grid gap-4"
          onSubmit={handleSubmit((values) => {
            setFailure(undefined);
            setSaved(false);
            mutation.mutate(values);
          })}
        >
          {failure ? (
            <FormError mensaje={failure.mensaje} traceId={failure.traceId} />
          ) : null}
          {saved ? (
            <p
              role="status"
              className="rounded-lg border border-border bg-muted px-3 py-2 text-sm"
            >
              Contraseña actualizada.
            </p>
          ) : null}
          <TextField
            id="contrasenaActual"
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            error={errors.contrasenaActual?.message}
            {...register("contrasenaActual")}
          />
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
            label="Repite la contraseña nueva"
            type="password"
            autoComplete="new-password"
            error={errors.confirmarContrasena?.message}
            {...register("confirmarContrasena")}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando…" : "Cambiar contraseña"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function PerfilView({ usuarioId }: { usuarioId: number }) {
  const query = useQuery({
    queryKey: ["perfil", usuarioId],
    queryFn: async ({ signal }) =>
      (
        await unwrap(
          api.get<PerfilUsuarioDTO>(perfilPath(usuarioId), { signal }),
        )
      ).data,
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Tu perfil"
        description="Tus datos y la seguridad de tu cuenta."
      />

      {query.isPending ? (
        <Loading label="Cargando tu perfil…" rows={3} />
      ) : query.isError ? (
        <ErrorState
          title="No pudimos cargar tu perfil"
          mensaje={toApiError(query.error).mensaje}
          traceId={toApiError(query.error).traceId}
          onRetry={() => query.refetch()}
        />
      ) : (
        <>
          <PerfilForm perfil={query.data} usuarioId={usuarioId} />
          <ContrasenaForm usuarioId={usuarioId} />
          <form action={logoutAction}>
            <Button type="submit" variant="outline">
              Cerrar sesión
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
