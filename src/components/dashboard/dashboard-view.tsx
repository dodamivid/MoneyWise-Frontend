"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, CalendarClock, Target } from "lucide-react";

import { FechaCorteAviso } from "@/components/ahorro/fecha-corte-aviso";
import {
  ChartDataTable,
  GastoPorCategoriaChart,
  MetasVsAhorroChart,
} from "@/components/dashboard/charts";
import { PageHeader } from "@/components/layout/page-header";
import { Empty } from "@/components/states/empty";
import { ErrorState } from "@/components/states/error-state";
import { Loading } from "@/components/states/loading";
import { buttonVariants } from "@/components/ui/button";
import { toApiError } from "@/lib/api/query";
import { useCatalogo } from "@/lib/catalogos/use-catalogo";
import {
  useBalance,
  useMetasVsAhorro,
  useRecientes,
  useResumen,
} from "@/lib/dashboard/queries";
import {
  formatDate,
  formatDateShort,
  formatMoney,
  formatPercent,
  formatSignedMoney,
  monthRangeIso,
} from "@/lib/format";
import { cn } from "@/lib/utils";

function Panel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "grid content-start gap-4 rounded-xl border border-border bg-card p-4 sm:p-5",
        className,
      )}
    >
      <div className="grid gap-0.5">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function BalanceBlock() {
  const { isCheckingCorte, corteError, refetchCorte, needsCorte, balance } =
    useBalance();

  if (needsCorte) return <FechaCorteAviso />;

  if (isCheckingCorte || (balance.isPending && !balance.isError)) {
    return <Loading label="Cargando tu balance…" rows={2} />;
  }

  const failure = corteError ?? (balance.isError ? balance.error : null);
  if (failure) {
    const error = toApiError(failure);
    return (
      <ErrorState
        title="No pudimos calcular tu balance"
        mensaje={error.mensaje}
        traceId={error.traceId}
        onRetry={() => (corteError ? refetchCorte() : balance.refetch())}
      />
    );
  }

  const data = balance.data;
  if (!data) {
    return (
      <Empty
        icon={CalendarClock}
        title="Todavía no hay balance para mostrar"
        description="Registra algunos ingresos o egresos después de tu fecha de corte."
        action={{ label: "Registrar ingreso", href: "/ingresos" }}
      />
    );
  }

  const negative = data.balanceAcumulado < 0;
  return (
    <section
      aria-label="Balance"
      className="grid gap-1 rounded-xl border border-border bg-card p-5 sm:p-6"
    >
      <p className="text-sm text-muted-foreground">
        Tu balance desde el {formatDate(data.fechaCorte)}
      </p>
      <p
        className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl"
        aria-label={`Balance: ${formatMoney(data.balanceAcumulado, { withCode: true })}${negative ? ", en negativo" : ""}`}
      >
        {formatMoney(data.balanceAcumulado)}
        <span className="ml-2 text-base font-medium text-muted-foreground">
          MXN
        </span>
      </p>
      <p className="text-sm text-muted-foreground">
        {negative
          ? "Has gastado más de lo que ha entrado desde esa fecha."
          : "Ha entrado más de lo que has gastado desde esa fecha."}
      </p>
    </section>
  );
}

function TotalsBlock({ range }: { range: { desde: string; hasta: string } }) {
  const resumen = useResumen(range);

  if (resumen.isPending) return <Loading label="Cargando totales…" rows={1} />;
  if (resumen.isError) {
    const error = toApiError(resumen.error);
    return (
      <ErrorState
        title="No pudimos cargar tus totales"
        mensaje={error.mensaje}
        traceId={error.traceId}
        onRetry={() => resumen.refetch()}
      />
    );
  }

  const { ingresos, egresos } = resumen.data.totales;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <section
        aria-label="Ingresos del mes"
        className="grid gap-1 rounded-xl border border-border bg-card p-4"
      >
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowUp className="size-4 text-ingreso" aria-hidden="true" />
          Ingresos del mes
        </p>
        <p className="text-2xl font-semibold text-ingreso tabular-nums">
          {formatSignedMoney(ingresos, "ingreso")}
        </p>
      </section>
      <section
        aria-label="Egresos del mes"
        className="grid gap-1 rounded-xl border border-border bg-card p-4"
      >
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowDown className="size-4 text-egreso" aria-hidden="true" />
          Egresos del mes
        </p>
        <p className="text-2xl font-semibold text-egreso tabular-nums">
          {formatSignedMoney(egresos, "egreso")}
        </p>
      </section>
    </div>
  );
}

function GastoBlock({ range }: { range: { desde: string; hasta: string } }) {
  const resumen = useResumen(range);

  return (
    <Panel
      title="Gasto por categoría"
      description="En qué se fue tu dinero este mes."
    >
      {resumen.isPending ? (
        <Loading label="Cargando gasto por categoría…" rows={3} />
      ) : resumen.isError ? (
        <ErrorState
          title="No pudimos cargar esta gráfica"
          mensaje={toApiError(resumen.error).mensaje}
          traceId={toApiError(resumen.error).traceId}
          onRetry={() => resumen.refetch()}
        />
      ) : resumen.data.egresosPorTipo.length === 0 ? (
        <Empty
          title="Aún no hay egresos este mes"
          description="Cuando registres uno, verás aquí en qué categoría se va."
          action={{ label: "Registrar egreso", href: "/egresos" }}
        />
      ) : (
        <>
          <GastoPorCategoriaChart
            data={resumen.data.egresosPorTipo.map((item) => ({
              nombre: item.tipo,
              total: item.total,
            }))}
          />
          <ChartDataTable
            caption="Gasto por categoría del mes"
            headers={["Categoría", "Total"]}
            rows={resumen.data.egresosPorTipo.map((item) => [
              item.tipo,
              formatMoney(item.total),
            ])}
          />
        </>
      )}
    </Panel>
  );
}

function MetasBlock({ range }: { range: { desde: string; hasta: string } }) {
  const query = useMetasVsAhorro(range);

  return (
    <Panel
      title="Metas y ahorro"
      description="Cuánto llevas de cada meta activa."
    >
      {query.isPending ? (
        <Loading label="Cargando tus metas…" rows={3} />
      ) : query.isError ? (
        <ErrorState
          title="No pudimos cargar tus metas"
          mensaje={toApiError(query.error).mensaje}
          traceId={toApiError(query.error).traceId}
          onRetry={() => query.refetch()}
        />
      ) : query.data.metas.length === 0 ? (
        <Empty
          icon={Target}
          title="Aún no tienes metas activas"
          description="Crea una meta para ver cuánto te falta."
          action={{ label: "Crear meta", href: "/metas" }}
        />
      ) : (
        <>
          <MetasVsAhorroChart
            data={query.data.metas.map((meta) => ({
              nombre: meta.nombre,
              objetivo: meta.montoObjetivo,
              ahorro: meta.ahorroReal,
            }))}
          />
          <ChartDataTable
            caption="Metas activas: objetivo, ahorrado y avance"
            headers={["Meta", "Objetivo", "Ahorrado", "Avance"]}
            rows={query.data.metas.map((meta) => [
              meta.nombre,
              formatMoney(meta.montoObjetivo),
              formatMoney(meta.ahorroReal),
              formatPercent(meta.porcentajeAvance),
            ])}
          />
        </>
      )}
    </Panel>
  );
}

function RecientesBlock() {
  const query = useRecientes(5);
  const tiposIngreso = useCatalogo("tipos-ingreso");
  const tiposEgreso = useCatalogo("tipos-egreso");
  const names = {
    ingreso: new Map(tiposIngreso.options.map((o) => [o.value, o.label])),
    egreso: new Map(tiposEgreso.options.map((o) => [o.value, o.label])),
  };

  return (
    <Panel title="Movimientos recientes">
      {query.isPending ? (
        <Loading label="Cargando movimientos recientes…" rows={3} />
      ) : query.isError ? (
        <ErrorState
          title="No pudimos cargar tus movimientos"
          mensaje={toApiError(query.error).mensaje}
          traceId={toApiError(query.error).traceId}
          onRetry={() => query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <Empty
          title="Aún no tienes movimientos"
          description="Registra tu primer ingreso o egreso para empezar."
          action={{ label: "Registrar ingreso", href: "/ingresos" }}
        />
      ) : (
        <>
          <ul className="grid divide-y divide-border">
            {query.data.map((item) => {
              const Icon = item.kind === "ingreso" ? ArrowUp : ArrowDown;
              return (
                <li
                  key={item.key}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="grid gap-0.5">
                    <p className="font-medium">
                      {item.descripcion?.trim() ||
                        names[item.kind].get(item.tipoId) ||
                        (item.kind === "ingreso" ? "Ingreso" : "Egreso")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateShort(item.fechaInicio)}
                      {names[item.kind].get(item.tipoId)
                        ? ` · ${names[item.kind].get(item.tipoId)}`
                        : ""}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "flex items-center gap-1 font-semibold tabular-nums",
                      item.kind === "ingreso" ? "text-ingreso" : "text-egreso",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {formatSignedMoney(item.monto, item.kind)}
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/ingresos"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Ver ingresos
            </Link>
            <Link
              href="/egresos"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Ver egresos
            </Link>
          </div>
        </>
      )}
    </Panel>
  );
}

export function DashboardView({ nombre }: { nombre?: string }) {
  const range = monthRangeIso();

  return (
    <div className="grid gap-6">
      <PageHeader
        title={nombre ? `Hola, ${nombre}` : "Resumen"}
        description={`Así va ${range.label}.`}
      />
      <BalanceBlock />
      <TotalsBlock range={range} />
      <div className="grid gap-6 lg:grid-cols-2">
        <GastoBlock range={range} />
        <MetasBlock range={range} />
      </div>
      <RecientesBlock />
    </div>
  );
}
