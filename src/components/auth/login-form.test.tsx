import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "./login-form";

const loginAction = vi.fn();

vi.mock("@/lib/auth/actions", () => ({
  loginAction: (...args: unknown[]) => loginAction(...args),
}));

beforeEach(() => {
  loginAction.mockReset();
});

describe("LoginForm", () => {
  it("muestra qué falta cuando se envía vacío y no llama al servidor", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(
      await screen.findByText("Escribe tu correo electrónico."),
    ).toBeInTheDocument();
    expect(screen.getByText("Escribe tu contraseña.")).toBeInTheDocument();
    expect(loginAction).not.toHaveBeenCalled();
  });

  it("enlaza el error con su campo para lectores de pantalla", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText("Correo electrónico"), "sin-arroba");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    const input = screen.getByLabelText("Correo electrónico");
    await waitFor(() => expect(input).toHaveAttribute("aria-invalid", "true"));
    const errorId = input.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId!)).toHaveTextContent(
      /correo válido/,
    );
  });

  it("envía los datos y la ruta de regreso", async () => {
    loginAction.mockResolvedValue({ ok: false, mensaje: "x" });
    const user = userEvent.setup();
    render(<LoginForm next="/metas" />);

    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "ana@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "Secreta123");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => expect(loginAction).toHaveBeenCalledTimes(1));
    expect(loginAction).toHaveBeenCalledWith(
      { correo: "ana@example.com", contrasena: "Secreta123" },
      "/metas",
    );
  });

  it("muestra el error del servidor con su código de referencia", async () => {
    loginAction.mockResolvedValue({
      ok: false,
      mensaje: "El correo o la contraseña no coinciden.",
      traceId: "trace-123",
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "ana@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "mala");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("El correo o la contraseña no coinciden.");
    expect(alert).toHaveTextContent("trace-123");
  });
});
