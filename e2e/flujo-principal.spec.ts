import { expect, test } from "@playwright/test";

/**
 * Flujo principal: registrarse → crear un egreso → verlo en el dashboard.
 * Corre contra el backend simulado, con datos que viven en memoria.
 */
test("una persona se registra, crea un egreso y lo ve en el resumen", async ({
  page,
}) => {
  const correo = `e2e-${Date.now()}@example.com`;
  const descripcion = `Renta E2E ${Date.now()}`;

  // 1. Las rutas privadas mandan a iniciar sesión.
  await page.goto("/egresos");
  await expect(page).toHaveURL(/\/login\?next=%2Fegresos/);

  // 2. Registro: abre la sesión solo.
  await page.getByRole("link", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/registro/);
  await page.getByLabel("Nombre", { exact: true }).fill("Ana");
  await page.getByLabel("Apellido paterno").fill("López");
  await page.getByLabel("Apellido materno").fill("Díaz");
  await page.getByLabel("Correo electrónico").fill(correo);
  await page.getByLabel("Fecha de nacimiento").fill("1995-04-12");
  await page.getByLabel("Contraseña", { exact: true }).fill("Secreta123");
  await page.getByLabel("Repite tu contraseña").fill("Secreta123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("heading", { name: "Hola, Ana" })).toBeVisible();

  // 3. Crear un egreso.
  await page.getByRole("link", { name: "Egresos" }).first().click();
  await expect(page.getByRole("heading", { name: "Egresos" })).toBeVisible();
  await page.getByRole("button", { name: "Registrar egreso" }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Tipo de egreso")).toBeEnabled();
  await dialog.getByLabel("Tipo de egreso").selectOption({ label: "Renta" });
  await dialog.getByLabel("Monto (MXN)").fill("6500");
  await dialog.getByLabel("Descripción (opcional)").fill(descripcion);
  await dialog.getByRole("button", { name: "Registrar egreso" }).click();

  await expect(page.getByText("Egreso registrado.")).toBeVisible();
  await expect(page.getByText(descripcion)).toBeVisible();

  // 4. Verlo en el dashboard, en movimientos recientes y en el total del mes.
  await page.getByRole("link", { name: "Resumen" }).first().click();
  await expect(page.getByRole("heading", { name: "Hola, Ana" })).toBeVisible();

  const recientes = page.getByRole("region", {
    name: "Movimientos recientes",
  });
  const item = recientes.getByRole("listitem").filter({ hasText: descripcion });
  await expect(item).toBeVisible();
  await expect(item).toContainText("−$6,500.00");

  await expect(
    page.getByRole("region", { name: "Egresos del mes" }),
  ).toContainText("−$");

  // 5. Cerrar sesión: las rutas privadas vuelven a pedir inicio de sesión.
  await page.getByRole("button", { name: "Cerrar sesión" }).first().click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});

test("el login rechaza una contraseña incorrecta con un mensaje claro", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("nadie@example.com");
  await page.getByLabel("Contraseña").fill("Incorrecta1");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  // Next.js agrega su propio role="alert" para anunciar rutas: se acota por texto.
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "El correo o la contraseña no coinciden" }),
  ).toBeVisible();
});
