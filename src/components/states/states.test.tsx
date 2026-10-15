import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Empty } from "./empty";
import { ErrorState } from "./error-state";
import { Loading } from "./loading";

describe("Loading", () => {
  it("se anuncia como estado ocupado con su texto", () => {
    render(<Loading label="Cargando tus ingresos…" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Cargando tus ingresos…");
  });
});

describe("Empty", () => {
  it("explica por qué está vacío y ofrece una acción", async () => {
    const onClick = vi.fn();
    render(
      <Empty
        title="Aún no registras ingresos"
        description="Registra el primero."
        action={{ label: "Registrar ingreso", onClick }}
      />,
    );
    expect(screen.getByText("Aún no registras ingresos")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Registrar ingreso" }),
    );
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("una acción con href es un enlace, no un botón", () => {
    render(
      <Empty
        title="Sin fecha"
        action={{ label: "Registrar fecha de corte", href: "/ahorro" }}
      />,
    );
    const link = screen.getByRole("link", { name: "Registrar fecha de corte" });
    expect(link).toHaveAttribute("href", "/ahorro");
  });
});

describe("ErrorState", () => {
  it("se anuncia como alerta con el mensaje y el código de referencia", () => {
    render(
      <ErrorState
        title="No pudimos cargar tus egresos"
        mensaje="Revisa tu conexión e inténtalo de nuevo."
        traceId="abc-123"
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("No pudimos cargar tus egresos");
    expect(alert).toHaveTextContent("Revisa tu conexión");
    expect(alert).toHaveTextContent("abc-123");
  });

  it("permite reintentar", async () => {
    const onRetry = vi.fn();
    render(<ErrorState mensaje="Falló." onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
