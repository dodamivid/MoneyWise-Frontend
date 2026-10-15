"use client";

import { useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Pencil, PiggyBank, Plus, Trash2 } from "lucide-react";

import {
  InversionForm,
  INVERSIONES_PATH,
} from "@/components/inversiones/inversion-form";
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
import type { InversionDTO } from "@/lib/api/types";
import { useCatalogo } from "@/lib/catalogos/use-catalogo";
import { formatDateShort, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

function isInversion(value: unknown): value is InversionDTO {
  const item = value as Partial<InversionDTO> | null;
  return (
    !!item &&
    typeof item.inversionId === "number" &&
    typeof item.objetivo === "string" &&
    typeof item.monto === "number"
  );
}

export function InversionesView() {
  const queryClient = useQueryClient();
  const [pagina, setPagina] = useState(1);
  const [editing, setEditing] = useState<InversionDTO | "new" | null>(null);
  const [deleting, setDeleting] = useState<InversionDTO | null>(null);
  const [deleteError, setDeleteError] = useState<ApiError>();
  const [notice, setNotice] = useState<string>();

  const destinos = useCatalogo("destinos");
  const destinoName = useMemo(
    () => new Map(destinos.options.map((o) => [o.value, o.label])),
    [destinos.options],
  );

  const params = { pagina, tamanoPagina: PAGE_SIZE, orden: "fechaInicio:desc" };

  const list = useQuery({
    queryKey: ["inversiones", params],
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const { data, meta } = await unwrap(
        api.get<unknown[]>(INVERSIONES_PATH, { query: params, signal }),
      );
      const rows = (Array.isArray(data) ? data : []).filter(isInversion);
      return { rows, total: meta?.paginacion?.total ?? rows.length };
    },
  });

  const removal = useMutation({
    mutationFn: (inversion: InversionDTO) =>
      unwrap(api.delete(`${INVERSIONES_PATH}/${inversion.inversionId}`)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["inversiones"] });
      setDeleting(null);
      setNotice("Inversión eliminada.");
      if ((list.data?.rows.length ?? 0) === 1 && pagina > 1) {
        setPagina(pagina - 1);
      }
    },
    onError: (error) => setDeleteError(toApiError(error)),
  });

  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Inversiones"
        description="Dónde pones a trabajar tu dinero."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden="true" />
            Registrar inversión
          </Button>
        }
      />

      {notice ? (
        <p
          role="status"
          className="rounded-lg border border-border bg-muted px-3 py-2 text-sm"
        >
          {notice}
        </p>
      ) : null}

      {list.isPending ? (
        <Loading label="Cargando tus inversiones…" />
      ) : list.isError ? (
        <ErrorState
          title="No pudimos cargar tus inversiones"
          mensaje={toApiError(list.error).mensaje}
          traceId={toApiError(list.error).traceId}
          onRetry={() => list.refetch()}
        />
      ) : list.data.rows.length === 0 ? (
        <Empty
          icon={PiggyBank}
          title="Aún no registras inversiones"
          description="Registra la primera para llevar el control de lo que has invertido."
          action={{
            label: "Registrar inversión",
            onClick: () => setEditing("new"),
          }}
        />
      ) : (
        <section aria-label="Lista de inversiones" className="grid gap-4">
          <ul
            className={cn(
              "grid gap-3",
              list.isPlaceholderData && "opacity-60 transition-opacity",
            )}
          >
            {list.data.rows.map((item) => (
              <li
                key={item.inversionId}
                className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4"
              >
                <div className="grid gap-0.5">
                  <h2 className="font-medium">{item.objetivo}</h2>
                  <p className="text-sm text-muted-foreground">
                    Desde {formatDateShort(item.fechaInicio)}
                    {item.fechaFin
                      ? ` · Vence ${formatDateShort(item.fechaFin)}`
                      : ""}
                    {` · Tasa ${item.tasaInteresPorc} %`}
                    {item.destinoId !== null && destinoName.get(item.destinoId)
                      ? ` · ${destinoName.get(item.destinoId)}`
                      : ""}
                  </p>
                </div>
                <p className="text-lg font-semibold tabular-nums">
                  {formatMoney(item.monto)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Editar inversión: ${item.objetivo}`}
                    onClick={() => setEditing(item)}
                  >
                    <Pencil aria-hidden="true" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Eliminar inversión: ${item.objetivo}`}
                    onClick={() => {
                      setDeleteError(undefined);
                      setDeleting(item);
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                    Eliminar
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          {pages > 1 ? (
            <nav
              aria-label="Paginación"
              className="flex items-center justify-between gap-2 text-sm"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <p aria-live="polite" className="text-muted-foreground">
                Página {pagina} de {pages} · {total} inversiones
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={pagina >= pages}
                onClick={() => setPagina((p) => p + 1)}
              >
                Siguiente
              </Button>
            </nav>
          ) : null}
        </section>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing === "new" || editing === null
                ? "Registrar inversión"
                : "Editar inversión"}
            </DialogTitle>
            <DialogDescription>
              {editing === "new" || editing === null
                ? "Cuéntanos qué inversión es y cuánto pusiste."
                : "Cambia lo que necesites y guarda."}
            </DialogDescription>
          </DialogHeader>
          {editing !== null ? (
            <InversionForm
              key={editing === "new" ? "new" : editing.inversionId}
              inversion={editing === "new" ? undefined : editing}
              onCancel={() => setEditing(null)}
              onSuccess={(message) => {
                setEditing(null);
                setNotice(message);
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
            <AlertDialogTitle>¿Eliminar esta inversión?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `${deleting.objetivo}, ${formatMoney(deleting.monto)}. Esta acción no se puede deshacer.`
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
              {removal.isPending ? "Eliminando…" : "Eliminar inversión"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
