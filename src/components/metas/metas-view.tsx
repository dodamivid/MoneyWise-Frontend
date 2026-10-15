"use client";

import { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { CircleCheck, Pencil, Plus, Target, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { MetaForm, METAS_PATH } from "@/components/metas/meta-form";
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
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/envelope";
import { toApiError, unwrap } from "@/lib/api/query";
import type { MetaDTO } from "@/lib/api/types";
import { formatDateShort, formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
type Estado = "activas" | "inactivas" | "todas";

const ESTADO_PARAM: Record<Estado, boolean | undefined> = {
  activas: true,
  inactivas: false,
  todas: undefined,
};

function isMeta(value: unknown): value is MetaDTO {
  const meta = value as Partial<MetaDTO> | null;
  return (
    !!meta &&
    typeof meta.metaId === "number" &&
    typeof meta.nombre === "string" &&
    typeof meta.montoObjetivo === "number"
  );
}

function ProgressBar({ meta }: { meta: MetaDTO }) {
  const percent = Math.max(0, Math.min(100, meta.porcentajeAvance));
  return (
    <div
      role="progressbar"
      aria-label={`Avance de ${meta.nombre}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      aria-valuetext={`${formatPercent(meta.porcentajeAvance)}: ${formatMoney(meta.ahorroReal)} de ${formatMoney(meta.montoObjetivo)}`}
      className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className="h-full rounded-full bg-meta motion-safe:transition-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function MetasView({ usuarioId }: { usuarioId: number }) {
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState<Estado>("activas");
  const [pagina, setPagina] = useState(1);
  const [editing, setEditing] = useState<MetaDTO | "new" | null>(null);
  const [deleting, setDeleting] = useState<MetaDTO | null>(null);
  const [deleteError, setDeleteError] = useState<ApiError>();
  const [notice, setNotice] = useState<string>();

  const params = {
    pagina,
    tamanoPagina: PAGE_SIZE,
    orden: "fechaInicio:desc",
    activa: ESTADO_PARAM[estado],
  };

  const list = useQuery({
    queryKey: ["metas", params],
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const { data, meta } = await unwrap(
        api.get<unknown[]>(METAS_PATH, { query: params, signal }),
      );
      const rows = (Array.isArray(data) ? data : []).filter(isMeta);
      return { rows, total: meta?.paginacion?.total ?? rows.length };
    },
  });

  const removal = useMutation({
    mutationFn: (meta: MetaDTO) =>
      unwrap(api.delete(`${METAS_PATH}/${meta.metaId}`)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["metas"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleting(null);
      setNotice("Meta eliminada.");
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
        title="Metas"
        description="Tus objetivos de ahorro y cómo avanzan."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden="true" />
            Crear meta
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

      <div className="grid max-w-xs gap-1.5">
        <Label htmlFor="filtro-estado">Mostrar</Label>
        <select
          id="filtro-estado"
          value={estado}
          onChange={(event) => {
            setEstado(event.target.value as Estado);
            setPagina(1);
          }}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        >
          <option value="activas">Metas activas</option>
          <option value="inactivas">Metas inactivas</option>
          <option value="todas">Todas</option>
        </select>
      </div>

      {list.isPending ? (
        <Loading label="Cargando tus metas…" />
      ) : list.isError ? (
        <ErrorState
          title="No pudimos cargar tus metas"
          mensaje={toApiError(list.error).mensaje}
          traceId={toApiError(list.error).traceId}
          onRetry={() => list.refetch()}
        />
      ) : list.data.rows.length === 0 ? (
        estado === "activas" ? (
          <Empty
            icon={Target}
            title="Aún no tienes metas activas"
            description="Crea una meta para ver cuánto te falta para lograrla."
            action={{ label: "Crear meta", onClick: () => setEditing("new") }}
          />
        ) : (
          <Empty
            icon={Target}
            title="No hay metas en esta vista"
            description="Cambia el filtro para ver otras metas."
            action={{
              label: "Ver metas activas",
              onClick: () => setEstado("activas"),
            }}
          />
        )
      ) : (
        <section aria-label="Lista de metas" className="grid gap-4">
          <ul
            className={cn(
              "grid gap-3",
              list.isPlaceholderData && "opacity-60 transition-opacity",
            )}
          >
            {list.data.rows.map((meta) => {
              const done = meta.porcentajeAvance >= 100;
              return (
                <li
                  key={meta.metaId}
                  className="grid gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="grid gap-0.5">
                      <h2 className="flex items-center gap-2 text-lg font-semibold">
                        <Target
                          className="size-5 text-meta"
                          aria-hidden="true"
                        />
                        {meta.nombre}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Desde {formatDateShort(meta.fechaInicio)}
                        {meta.fechaFin
                          ? ` · Objetivo: ${formatDateShort(meta.fechaFin)}`
                          : ""}
                        {!meta.activa ? " · Inactiva" : ""}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "flex items-center gap-1 text-lg font-semibold tabular-nums",
                        done && "text-ingreso",
                      )}
                    >
                      {done ? (
                        <CircleCheck className="size-5" aria-hidden="true" />
                      ) : null}
                      {done
                        ? `Meta cumplida · ${formatPercent(meta.porcentajeAvance)}`
                        : formatPercent(meta.porcentajeAvance)}
                    </p>
                  </div>
                  <ProgressBar meta={meta} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm tabular-nums">
                      {formatMoney(meta.ahorroReal)} de{" "}
                      {formatMoney(meta.montoObjetivo)} MXN
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Editar meta: ${meta.nombre}`}
                        onClick={() => setEditing(meta)}
                      >
                        <Pencil aria-hidden="true" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Eliminar meta: ${meta.nombre}`}
                        onClick={() => {
                          setDeleteError(undefined);
                          setDeleting(meta);
                        }}
                      >
                        <Trash2 aria-hidden="true" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
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
                Página {pagina} de {pages}
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
                ? "Crear meta"
                : "Editar meta"}
            </DialogTitle>
            <DialogDescription>
              {editing === "new" || editing === null
                ? "Ponle nombre, cuánto quieres juntar y desde cuándo."
                : "Cambia lo que necesites y guarda."}
            </DialogDescription>
          </DialogHeader>
          {editing !== null ? (
            <MetaForm
              key={editing === "new" ? "new" : editing.metaId}
              usuarioId={usuarioId}
              meta={editing === "new" ? undefined : editing}
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
            <AlertDialogTitle>¿Eliminar esta meta?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `${deleting.nombre}. Dejará de aparecer en tus metas activas y en el resumen. Podrás verla en "Metas inactivas".`
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
              {removal.isPending ? "Eliminando…" : "Eliminar meta"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
