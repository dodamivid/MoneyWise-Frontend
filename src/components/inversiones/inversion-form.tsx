"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";

import { FormError } from "@/components/auth/form-error";
import { TextField } from "@/components/auth/text-field";
import { CatalogSelect } from "@/components/forms/catalog-select";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/envelope";
import { extractFieldIssues } from "@/lib/api/field-errors";
import { toApiError, unwrap } from "@/lib/api/query";
import type { InversionDTO } from "@/lib/api/types";
import { isoToDateInput } from "@/lib/format";
import {
  emptyInversion,
  INVERSION_FIELDS,
  inversionSchema,
  toInversionBody,
  type InversionField,
  type InversionFormValues,
} from "@/lib/inversiones/schema";

export const INVERSIONES_PATH = "/v1/inversiones";

interface InversionFormProps {
  inversion?: InversionDTO;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

function toValues(inversion: InversionDTO): InversionFormValues {
  return {
    objetivo: inversion.objetivo,
    monto: String(inversion.monto),
    tasaInteresPorc: String(inversion.tasaInteresPorc),
    destinoId: inversion.destinoId === null ? "" : String(inversion.destinoId),
    fechaInicio: isoToDateInput(inversion.fechaInicio),
    fechaFin: inversion.fechaFin ? isoToDateInput(inversion.fechaFin) : "",
  };
}

export function InversionForm({
  inversion,
  onSuccess,
  onCancel,
}: InversionFormProps) {
  const queryClient = useQueryClient();
  const [failure, setFailure] = useState<ApiError>();
  const editing = inversion !== undefined;

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<InversionFormValues>({
    resolver: zodResolver(inversionSchema),
    defaultValues: inversion
      ? toValues(inversion)
      : emptyInversion(isoToDateInput(new Date())),
  });
  const destinoId = useWatch({ control, name: "destinoId" });

  const mutation = useMutation({
    mutationFn: (values: InversionFormValues) =>
      unwrap(
        editing
          ? api.patch(
              `${INVERSIONES_PATH}/${inversion.inversionId}`,
              toInversionBody(values),
            )
          : api.post(INVERSIONES_PATH, toInversionBody(values)),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inversiones"] });
      onSuccess(
        editing
          ? "Cambios de la inversión guardados."
          : "Inversión registrada.",
      );
    },
    onError: (error) => {
      const apiError = toApiError(error);
      setFailure(apiError);
      for (const issue of extractFieldIssues(apiError)) {
        if ((INVERSION_FIELDS as readonly string[]).includes(issue.field)) {
          setError(issue.field as InversionField, { message: issue.message });
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
        id="objetivo"
        label="¿En qué estás invirtiendo?"
        autoComplete="off"
        placeholder="CETES a 28 días"
        error={errors.objetivo?.message}
        {...register("objetivo")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="monto"
          label="Monto invertido (MXN)"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          error={errors.monto?.message}
          {...register("monto")}
        />
        <TextField
          id="tasaInteresPorc"
          label="Tasa de interés anual (%)"
          inputMode="decimal"
          autoComplete="off"
          hint="De 0 a 100."
          error={errors.tasaInteresPorc?.message}
          {...register("tasaInteresPorc")}
        />
      </div>
      <CatalogSelect
        id="destinoId"
        catalogo="destinos"
        label="Cuenta o destino (opcional)"
        placeholder="Sin especificar"
        value={destinoId}
        error={errors.destinoId?.message}
        {...register("destinoId")}
      />
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
          label="Fecha de vencimiento (opcional)"
          type="date"
          error={errors.fechaFin?.message}
          {...register("fechaFin")}
        />
      </div>

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
              : "Registrar inversión"}
        </Button>
      </div>
    </form>
  );
}
