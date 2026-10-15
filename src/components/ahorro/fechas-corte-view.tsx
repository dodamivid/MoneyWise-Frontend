"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormError } from "@/components/auth/form-error";
import { TextField } from "@/components/auth/text-field";
import { PageHeader } from "@/components/layout/page-header";
import { Empty } from "@/components/states/empty";
import { ErrorState } from "@/components/states/error-state";
import { Loading } from "@/components/states/loading";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/envelope";
import { toApiError, unwrap } from "@/lib/api/query";
import {
  FECHAS_CORTE_KEY,
  FECHAS_CORTE_PATH,
  useFechasCorte,
  type FechaCorteRow,
} from "@/lib/ahorro/use-fechas-corte";
import { dateInputToIso, formatDate, isoToDateInput } from "@/lib/format";

const schema = z.object({
  fechaCorte: z
    .string()
    .min(1, "Elige la fecha de corte.")
    .refine((v) => dateInputToIso(v) !== null, "Elige una fecha válida."),
});
type Values = z.infer<typeof schema>;

/** El balance del dashboard depende de estos datos. */
function invalidate(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: FECHAS_CORTE_KEY }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  ]);
}

function NuevaFechaForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const queryClient = useQueryClient();
  const [failure, setFailure] = useState<ApiError>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fechaCorte: isoToDateInput(new Date()) },
  });

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      unwrap(
        api.post(FECHAS_CORTE_PATH, {
          fechaCorte: dateInputToIso(values.fechaCorte),
        }),
      ),
    onSuccess: async () => {
      await invalidate(queryClient);
      onSuccess();
    },
    onError: (error) => setFailure(toApiError(error)),
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
        <FormError mensaje={failure.mensaje} traceId={failure.traceId} />
      ) : null}
      <TextField
        id="fechaCorte"
        label="Fecha de corte"
        type="date"
        error={errors.fechaCorte?.message}
        {...register("fechaCorte")}
      />
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
          {mutation.isPending ? "Guardando…" : "Registrar fecha de corte"}
        </Button>
      </div>
    </form>
  );
}

export function FechasCorteView() {
  const queryClient = useQueryClient();
  const query = useFechasCorte();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<FechaCorteRow | null>(null);
  const [deleteError, setDeleteError] = useState<ApiError>();
  const [notice, setNotice] = useState<string>();

  const removal = useMutation({
    mutationFn: (row: FechaCorteRow) =>
      unwrap(api.delete(`${FECHAS_CORTE_PATH}/${row.id}`)),
    onSuccess: async () => {
      await invalidate(queryClient);
      setDeleting(null);
      setNotice("Fecha de corte eliminada.");
    },
    onError: (error) => setDeleteError(toApiError(error)),
  });

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Fecha de corte"
        description="El día desde el que se calcula tu balance."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" />
            Registrar fecha de corte
          </Button>
        }
      />

      <section
        aria-label="Para qué sirve"
        className="rounded-xl border border-border bg-card p-4 text-sm"
      >
        <p className="font-medium">¿Para qué sirve?</p>
        <p className="mt-1 text-muted-foreground">
          Tu balance suma los ingresos y resta los egresos a partir de esta
          fecha. Sin una fecha de corte registrada, no podemos mostrarte el
          balance en tu resumen. Puedes registrar una nueva cuando empieces un
          periodo de ahorro.
        </p>
      </section>

      {notice ? (
        <p
          role="status"
          className="rounded-lg border border-border bg-muted px-3 py-2 text-sm"
        >
          {notice}
        </p>
      ) : null}

      {query.isPending ? (
        <Loading label="Cargando fechas de corte…" rows={2} />
      ) : query.isError ? (
        <ErrorState
          title="No pudimos cargar tus fechas de corte"
          mensaje={toApiError(query.error).mensaje}
          traceId={toApiError(query.error).traceId}
          onRetry={() => query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <Empty
          icon={CalendarClock}
          title="Aún no tienes una fecha de corte"
          description="Regístrala para ver tu balance en el resumen."
          action={{
            label: "Registrar fecha de corte",
            onClick: () => setCreating(true),
          }}
        />
      ) : (
        <ul className="grid gap-2" aria-label="Fechas de corte registradas">
          {query.data.map((row, index) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <CalendarClock
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium">{formatDate(row.fechaCorte)}</p>
                  {index === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      La más reciente
                    </p>
                  ) : null}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                aria-label={`Eliminar fecha de corte del ${formatDate(row.fechaCorte)}`}
                onClick={() => {
                  setDeleteError(undefined);
                  setDeleting(row);
                }}
              >
                <Trash2 aria-hidden="true" />
                Eliminar
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar fecha de corte</DialogTitle>
            <DialogDescription>
              Elige el día desde el que quieres calcular tu balance.
            </DialogDescription>
          </DialogHeader>
          {creating ? (
            <NuevaFechaForm
              onCancel={() => setCreating(false)}
              onSuccess={() => {
                setCreating(false);
                setNotice("Fecha de corte registrada.");
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !removal.isPending) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta fecha de corte?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `${formatDate(deleting.fechaCorte)}. Tu balance se recalculará con la fecha anterior, o quedará sin calcular si no hay otra. Esta acción no se puede deshacer.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <p role="alert" className="text-sm text-destructive">
              No pudimos eliminarla. {deleteError.mensaje}
              {deleteError.traceId
                ? ` (Código de referencia: ${deleteError.traceId})`
                : ""}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removal.isPending}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={removal.isPending}
              onClick={() => deleting && removal.mutate(deleting)}
            >
              {removal.isPending ? "Eliminando…" : "Eliminar fecha de corte"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
