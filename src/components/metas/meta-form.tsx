"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { FormError } from "@/components/auth/form-error";
import { TextField } from "@/components/auth/text-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/envelope";
import { extractFieldIssues } from "@/lib/api/field-errors";
import { toApiError, unwrap } from "@/lib/api/query";
import type { MetaDTO } from "@/lib/api/types";
import { isoToDateInput } from "@/lib/format";
import {
  emptyMeta,
  META_FIELDS,
  metaSchema,
  toCreateBody,
  toUpdateBody,
  type MetaField,
  type MetaFormValues,
} from "@/lib/metas/schema";

export const METAS_PATH = "/v1/metas";

interface MetaFormProps {
  /** Si viene, el formulario edita; si no, crea. */
  meta?: MetaDTO;
  usuarioId: number;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

function metaToValues(meta: MetaDTO): MetaFormValues {
  return {
    nombre: meta.nombre,
    montoObjetivo: String(meta.montoObjetivo),
    ahorroReal: String(meta.ahorroReal),
    fechaInicio: isoToDateInput(meta.fechaInicio),
    fechaFin: meta.fechaFin ? isoToDateInput(meta.fechaFin) : "",
    activa: meta.activa,
  };
}

export function MetaForm({
  meta,
  usuarioId,
  onSuccess,
  onCancel,
}: MetaFormProps) {
  const queryClient = useQueryClient();
  const [failure, setFailure] = useState<ApiError>();
  const editing = meta !== undefined;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<MetaFormValues>({
    resolver: zodResolver(metaSchema),
    defaultValues: meta
      ? metaToValues(meta)
      : emptyMeta(isoToDateInput(new Date())),
  });

  const mutation = useMutation({
    mutationFn: (values: MetaFormValues) =>
      unwrap(
        editing
          ? api.patch(`${METAS_PATH}/${meta.metaId}`, toUpdateBody(values))
          : api.post(METAS_PATH, toCreateBody(values, usuarioId)),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["metas"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onSuccess(editing ? "Cambios de la meta guardados." : "Meta creada.");
    },
    onError: (error) => {
      const apiError = toApiError(error);
      setFailure(apiError);
      for (const issue of extractFieldIssues(apiError)) {
        if ((META_FIELDS as readonly string[]).includes(issue.field)) {
          setError(issue.field as MetaField, { message: issue.message });
        }
      }
    },
  });

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={handleSubmit((values) => {
        setFailure(undefined);
        mutation.mutate(values);
      })}
    >
      {failure ? (
        <FormError
          mensaje={
            failure.status === 422 || failure.status === 400
              ? "Revisa los campos marcados e inténtalo de nuevo."
              : failure.mensaje
          }
          traceId={failure.traceId}
        />
      ) : null}

      <TextField
        id="nombre"
        label="Nombre de la meta"
        autoComplete="off"
        placeholder="Viaje a Oaxaca"
        error={errors.nombre?.message}
        {...register("nombre")}
      />
      <TextField
        id="montoObjetivo"
        label="Monto objetivo (MXN)"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        error={errors.montoObjetivo?.message}
        {...register("montoObjetivo")}
      />
      {editing ? (
        <TextField
          id="ahorroReal"
          label="Lo que llevas ahorrado (MXN)"
          inputMode="decimal"
          autoComplete="off"
          hint="No puede ser mayor que el monto objetivo."
          error={errors.ahorroReal?.message}
          {...register("ahorroReal")}
        />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="fechaInicio"
          label="Fecha de inicio"
          type="date"
          error={errors.fechaInicio?.message}
          {...register("fechaInicio")}
        />
        <TextField
          id="fechaFin"
          label="Fecha objetivo (opcional)"
          type="date"
          hint={
            editing ? "Una fecha ya guardada no se puede quitar." : undefined
          }
          error={errors.fechaFin?.message}
          {...register("fechaFin")}
        />
      </div>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            id="activa"
            type="checkbox"
            className="size-4 rounded border-input accent-primary"
            {...register("activa")}
          />
          <Label htmlFor="activa">Meta activa</Label>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={mutation.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? "Guardando…"
            : editing
              ? "Guardar cambios"
              : "Crear meta"}
        </Button>
      </div>
    </form>
  );
}
