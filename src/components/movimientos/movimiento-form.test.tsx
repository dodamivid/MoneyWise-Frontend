import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MOVIMIENTOS } from "@/lib/movimientos/config";
import { MovimientoForm } from "./movimiento-form";

const CATALOGOS: Record<string, { id: string; nombres: string[] }> = {
  "/api/mw/v1/catalogos/tipos-ingreso": {
    id: "tipoIngresoId",
    nombres: ["Sueldo", "Bono"],
  },
  "/api/mw/v1/catalogos/tipos-egreso": {
    id: "tipoEgresoId",
    nombres: ["Renta", "Súper"],
  },
  "/api/mw/v1/catalogos/procedencias": {
    id: "procedenciaId",
    nombres: ["Empleo"],
  },
  "/api/mw/v1/catalogos/destinos": { id: "destinoId", nombres: ["Efectivo"] },
};

const fetchMock = vi.fn();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input: string, init?: RequestInit) => {
    const url = new URL(input, "http://localhost");
    const catalogo = CATALOGOS[url.pathname];
    if (catalogo && (init?.method ?? "GET") === "GET") {
      return json({
        ok: true,
        status: 200,
        data: catalogo.nombres.map((nombre, index) => ({
          [catalogo.id]: index + 1,
          nombre,
        })),
      });
    }
    return json({ ok: true, status: 201, data: { ingresoId: 99 } }, 201);
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderForm(kind: "ingreso" | "egreso", props = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onSuccess = vi.fn();
  const onCancel = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <MovimientoForm
        config={MOVIMIENTOS[kind]}
        onSuccess={onSuccess}
        onCancel={onCancel}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { onSuccess, onCancel };
}

describe("MovimientoForm", () => {
  it("usa los textos de cada tipo", async () => {
    renderForm("egreso");
    expect(await screen.findByLabelText("Tipo de egreso")).toBeInTheDocument();
    expect(screen.getByLabelText(/Destino/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar egreso" }),
    ).toBeInTheDocument();
  });

  it("no envía y explica qué falta", async () => {
    const user = userEvent.setup();
    renderForm("ingreso");
    await screen.findByRole("option", { name: "Sueldo" });

    await user.click(screen.getByRole("button", { name: "Registrar ingreso" }));

    expect(await screen.findByText("Elige un tipo.")).toBeInTheDocument();
    expect(screen.getByText("Escribe el monto.")).toBeInTheDocument();
    const posts = fetchMock.mock.calls.filter(
      ([, init]) => (init as RequestInit | undefined)?.method === "POST",
    );
    expect(posts).toHaveLength(0);
  });

  it("envía el alta con el monto como número y la fecha a mediodía de México", async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderForm("ingreso");
    await screen.findByRole("option", { name: "Bono" });

    await user.selectOptions(screen.getByLabelText("Tipo de ingreso"), "Bono");
    await user.type(screen.getByLabelText("Monto (MXN)"), "1,250.50");
    await user.type(
      screen.getByLabelText("Descripción (opcional)"),
      "Bono de prueba",
    );
    await user.click(screen.getByRole("button", { name: "Registrar ingreso" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    const post = fetchMock.mock.calls.find(
      ([, init]) => (init as RequestInit | undefined)?.method === "POST",
    );
    expect(post?.[0]).toBe("/api/mw/v1/ingresos");
    const body = JSON.parse((post?.[1] as RequestInit).body as string);
    expect(body).toMatchObject({
      tipoId: 2,
      monto: 1250.5,
      descripcion: "Bono de prueba",
    });
    expect(body.fechaInicio).toMatch(/T18:00:00\.000Z$/);
    expect(onSuccess).toHaveBeenCalledWith("Ingreso registrado.");
  });

  it("muestra el error del backend junto al campo", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (input: string, init?: RequestInit) => {
      const url = new URL(input, "http://localhost");
      const catalogo = CATALOGOS[url.pathname];
      if (catalogo && (init?.method ?? "GET") === "GET") {
        return json({
          ok: true,
          status: 200,
          data: catalogo.nombres.map((nombre, index) => ({
            [catalogo.id]: index + 1,
            nombre,
          })),
        });
      }
      return json(
        {
          ok: false,
          status: 422,
          error: {
            status: 422,
            mensaje: "Datos de ingreso invalidos",
            codigo: "DATOS_INVALIDOS",
            traceId: "trace-422",
            detalles: [
              { path: ["monto"], message: "monto no es un valor permitido" },
            ],
          },
        },
        422,
      );
    });
    renderForm("ingreso");
    await screen.findByRole("option", { name: "Sueldo" });

    await user.selectOptions(
      screen.getByLabelText("Tipo de ingreso"),
      "Sueldo",
    );
    await user.type(screen.getByLabelText("Monto (MXN)"), "100");
    await user.click(screen.getByRole("button", { name: "Registrar ingreso" }));

    expect(
      await screen.findByText("monto no es un valor permitido"),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Revisa los campos marcados",
    );
  });

  it("cancelar no envía nada", async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm("egreso");
    await screen.findByRole("option", { name: "Renta" });
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
