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
import { isoToDateInput } from "@/lib/format";
import type { MovimientoConfig, MovimientoRow } from "@/lib/movimientos/config";
import {
  backendFieldToForm,
  emptyValues,
  movimientoSchema,
  rowToValues,
  toBody,
  type MovimientoFormValues,
} from "@/lib/movimientos/schema";

interface MovimientoFormProps {
  config: MovimientoConfig;
  /** Si viene, el formulario edita; si no, crea. */
  row?: MovimientoRow;
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

export function MovimientoForm({
  config,
  row,
  onSuccess,
  onCancel,
}: MovimientoFormProps) {
  const queryClient = useQueryClient();
  const [failure, setFailure] = useState<ApiError>();
  const { texts } = config;
  const editing = row !== undefined;

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<MovimientoFormValues>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: row
      ? rowToValues(row, (iso) => isoToDateInput(iso))
      : emptyValues(isoToDateInput(new Date())),
  });

  const mutation = useMutation({
    mutationFn: async (values: MovimientoFormValues) => {
      const body = toBody(values, config, editing ? "update" : "create");
      const request = editing
        ? api.patch(`${config.path}/${row.id}`, body)
        : api.post(config.path, body);
      return unwrap(request);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["movimientos", config.kind],
      });
      // El dashboard depende de estos datos.
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onSuccess(
        editing
          ? `Cambios del ${texts.singular} guardados.`
          : `${texts.singular[0].toUpperCase()}${texts.singular.slice(1)} registrado.`,
      );
    },
    onError: (error) => {
      const apiError = toApiError(error);
      setFailure(apiError);
      for (const issue of extractFieldIssues(apiError)) {
        const field = backendFieldToForm(issue.field, config);
        if (field) setError(field, { message: issue.message });
      }
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFailure(undefined);
    mutation.mutate(values);
  });

  // Los selects se controlan: sus opciones llegan después del primer render y
  // un valor no controlado no se vuelve a seleccionar cuando aparecen.
  const tipoId = useWatch({ control, name: "tipoId" });
  const secondaryId = useWatch({ control, name: "secondaryId" });

  const pending = mutation.isPending;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
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

      <CatalogSelect
        id="tipoId"
        catalogo={config.tipoCatalogo}
        label={texts.tipoLabel}
        value={tipoId}
        error={errors.tipoId?.message}
        {...register("tipoId")}
      />
      <CatalogSelect
        id="secondaryId"
        catalogo={config.secondaryCatalogo}
        label={`${texts.secondaryLabel} (opcional)`}
        placeholder="Sin especificar"
        value={secondaryId}
        error={errors.secondaryId?.message}
        {...register("secondaryId")}
      />
      <TextField
        id="monto"
        label="Monto (MXN)"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        hint="Hasta 2 decimales. Ejemplo: 1250.50"
        error={errors.monto?.message}
        {...register("monto")}
      />
      <TextField
        id="descripcion"
        label="Descripción (opcional)"
        autoComplete="off"
        error={errors.descripcion?.message}
        {...register("descripcion")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="fechaInicio"
          label="Fecha"
          type="date"
          error={errors.fechaInicio?.message}
          {...register("fechaInicio")}
        />
        <TextField
          id="fechaFin"
          label="Fecha final (opcional)"
          type="date"
          hint={
            editing
              ? "Una fecha final ya guardada no se puede quitar."
              : undefined
          }
          error={errors.fechaFin?.message}
          {...register("fechaFin")}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : editing ? "Guardar cambios" : texts.create}
        </Button>
      </div>
    </form>
  );
}
