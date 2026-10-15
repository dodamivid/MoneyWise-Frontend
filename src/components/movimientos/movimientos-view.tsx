"use client";

import { useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";

import { CatalogSelect } from "@/components/forms/catalog-select";
import { PageHeader } from "@/components/layout/page-header";
import { MovimientoForm } from "@/components/movimientos/movimiento-form";
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
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/envelope";
import { toApiError, unwrap } from "@/lib/api/query";
import { useCatalogo } from "@/lib/catalogos/use-catalogo";
import {
  dateInputToIso,
  formatDateShort,
  formatSignedMoney,
} from "@/lib/format";
import {
  MOVIMIENTOS,
  toRow,
  type MovimientoKind,
  type MovimientoRow,
} from "@/lib/movimientos/config";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

interface Filters {
  tipoId: string;
  desde: string;
  hasta: string;
}
const NO_FILTERS: Filters = { tipoId: "", desde: "", hasta: "" };

/** Inicio y fin del día en hora de México, como ISO para `desde` y `hasta`. */
function dayBounds(filters: Filters) {
  const start = filters.desde ? dateInputToIso(filters.desde) : null;
  const end = filters.hasta ? dateInputToIso(filters.hasta) : null;
  return {
    desde: start
      ? new Date(Date.parse(start) - 12 * 3600_000).toISOString()
      : undefined,
    hasta: end
      ? new Date(Date.parse(end) + 12 * 3600_000 - 1).toISOString()
      : undefined,
  };
}

export function MovimientosView({ kind }: { kind: MovimientoKind }) {
  const config = MOVIMIENTOS[kind];
  const { texts } = config;
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [pagina, setPagina] = useState(1);
  const [editing, setEditing] = useState<MovimientoRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<MovimientoRow | null>(null);
  const [deleteError, setDeleteError] = useState<ApiError>();
  const [notice, setNotice] = useState<string>();

  const tipos = useCatalogo(config.tipoCatalogo);
  const secundarios = useCatalogo(config.secondaryCatalogo);
  const tipoName = useMemo(
    () => new Map(tipos.options.map((o) => [o.value, o.label])),
    [tipos.options],
  );
  const secondaryName = useMemo(
    () => new Map(secundarios.options.map((o) => [o.value, o.label])),
    [secundarios.options],
  );

  const bounds = dayBounds(filters);
  const params = {
    pagina,
    tamanoPagina: PAGE_SIZE,
    orden: "fechaInicio:desc",
    tipoId: filters.tipoId || undefined,
    ...bounds,
  };

  const list = useQuery({
    queryKey: ["movimientos", kind, params],
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const { data, meta } = await unwrap(
        api.get<Record<string, unknown>[]>(config.path, {
          query: params,
          signal,
        }),
      );
      const rows = (Array.isArray(data) ? data : [])
        .map((raw) => toRow(raw, config))
        .filter((row): row is MovimientoRow => row !== null);
      return { rows, total: meta?.paginacion?.total ?? rows.length };
    },
  });

  const removal = useMutation({
    mutationFn: (row: MovimientoRow) =>
      unwrap(api.delete(`${config.path}/${row.id}`)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["movimientos", kind] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleting(null);
      setNotice(
        `${texts.singular[0].toUpperCase()}${texts.singular.slice(1)} eliminado.`,
      );
      // Si se borró lo último de la página, se regresa a la anterior.
      if ((list.data?.rows.length ?? 0) === 1 && pagina > 1) {
        setPagina(pagina - 1);
      }
    },
    onError: (error) => setDeleteError(toApiError(error)),
  });

  const hasFilters = Object.values(filters).some((v) => v !== "");
  const total = list.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function updateFilter(patch: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPagina(1);
  }

  function labelFor(row: MovimientoRow) {
    return (
      row.descripcion?.trim() || tipoName.get(row.tipoId) || texts.singular
    );
  }

  const SignIcon = kind === "ingreso" ? ArrowUp : ArrowDown;
  const amountClass = kind === "ingreso" ? "text-ingreso" : "text-egreso";

  return (
    <div className="grid gap-6">
      <PageHeader
        title={texts.title}
        description={texts.description}
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden="true" />
            {texts.create}
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

      <section
        aria-label="Filtros"
        className="grid gap-3 sm:grid-cols-4 sm:items-end"
      >
        <CatalogSelect
          id="filtro-tipo"
          catalogo={config.tipoCatalogo}
          label={texts.tipoLabel}
          placeholder="Todos"
          value={filters.tipoId}
          onChange={(event) => updateFilter({ tipoId: event.target.value })}
        />
        <div className="grid gap-1.5">
          <Label htmlFor="filtro-desde">Desde</Label>
          <Input
            id="filtro-desde"
            type="date"
            value={filters.desde}
            max={filters.hasta || undefined}
            onChange={(event) => updateFilter({ desde: event.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="filtro-hasta">Hasta</Label>
          <Input
            id="filtro-hasta"
            type="date"
            value={filters.hasta}
            min={filters.desde || undefined}
            onChange={(event) => updateFilter({ hasta: event.target.value })}
          />
        </div>
        <Button
          variant="outline"
          disabled={!hasFilters}
          onClick={() => updateFilter(NO_FILTERS)}
        >
          Limpiar filtros
        </Button>
      </section>

      {list.isPending ? (
        <Loading label={`Cargando ${texts.plural}…`} />
      ) : list.isError ? (
        <ErrorState
          title={`No pudimos cargar tus ${texts.plural}`}
          mensaje={toApiError(list.error).mensaje}
          traceId={toApiError(list.error).traceId}
          onRetry={() => list.refetch()}
        />
      ) : list.data.rows.length === 0 ? (
        hasFilters ? (
          <Empty
            title={`No hay ${texts.plural} con estos filtros`}
            description="Prueba con otro tipo o con otro rango de fechas."
            action={{
              label: "Limpiar filtros",
              onClick: () => updateFilter(NO_FILTERS),
            }}
          />
        ) : (
          <Empty
            title={texts.emptyTitle}
            description={texts.emptyDescription}
            action={{ label: texts.create, onClick: () => setEditing("new") }}
          />
        )
      ) : (
        <section aria-label={`Lista de ${texts.plural}`} className="grid gap-4">
          <ul
            className={cn(
              "grid gap-2",
              list.isPlaceholderData && "opacity-60 transition-opacity",
            )}
          >
            {list.data.rows.map((row) => (
              <li
                key={row.id}
                className="grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4"
              >
                <div className="grid gap-0.5">
                  <p className="font-medium">{labelFor(row)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateShort(row.fechaInicio)}
                    {" · "}
                    {tipoName.get(row.tipoId) ?? "Sin tipo"}
                    {row.secondaryId !== null &&
                    secondaryName.get(row.secondaryId)
                      ? ` · ${secondaryName.get(row.secondaryId)}`
                      : ""}
                  </p>
                </div>
                <p
                  className={cn(
                    "flex items-center gap-1 text-lg font-semibold tabular-nums",
                    amountClass,
                  )}
                >
                  <SignIcon className="size-4" aria-hidden="true" />
                  {formatSignedMoney(row.monto, kind)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Editar ${texts.singular}: ${labelFor(row)}`}
                    onClick={() => setEditing(row)}
                  >
                    <Pencil aria-hidden="true" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Eliminar ${texts.singular}: ${labelFor(row)}`}
                    onClick={() => {
                      setDeleteError(undefined);
                      setDeleting(row);
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                    Eliminar
                  </Button>
                </div>
              </li>
            ))}
          </ul>

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
              Página {pagina} de {pages} · {total}{" "}
              {total === 1 ? texts.singular : texts.plural}
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
                ? texts.create
                : `Editar ${texts.singular}`}
            </DialogTitle>
            <DialogDescription>
              {editing === "new" || editing === null
                ? "Llena los datos y guarda."
                : "Cambia lo que necesites y guarda."}
            </DialogDescription>
          </DialogHeader>
          {editing !== null ? (
            <MovimientoForm
              key={editing === "new" ? "new" : editing.id}
              config={config}
              row={editing === "new" ? undefined : editing}
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
            <AlertDialogTitle>
              ¿Eliminar este {texts.singular}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleting
                ? `${labelFor(deleting)}, ${formatSignedMoney(deleting.monto, kind)}. Esta acción no se puede deshacer.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <p role="alert" className="text-sm text-destructive">
              No pudimos eliminarlo. {deleteError.mensaje}
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
              {removal.isPending ? "Eliminando…" : `Eliminar ${texts.singular}`}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
