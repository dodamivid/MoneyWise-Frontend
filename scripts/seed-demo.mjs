/**
 * Crea el usuario demo de MoneyWise con datos de prueba que se ven bien.
 *
 *   npm run seed:demo
 *
 * Lee `API_BASE_URL` y `API_KEY` de `.env.local` (o del entorno). Es chico a
 * propósito (≈ 25 peticiones): la base de Railway es de prueba y no conviene
 * cargarla de más. Es seguro volver a correrlo: si el usuario ya tiene
 * ingresos, no agrega nada (usa `--force` para agregar de todos modos).
 *
 * El usuario demo es:
 *   correo      demo@moneywise.app
 *   contraseña  Demo12345
 */

const BASE = (process.env.API_BASE_URL ?? "").replace(/\/+$/, "");
const KEY = process.env.API_KEY ?? "";
const FORCE = process.argv.includes("--force");

const DEMO = {
  nombre: "Demo",
  apellidoP: "MoneyWise",
  apellidoM: "Portafolio",
  correo: process.env.DEMO_EMAIL ?? "demo@moneywise.app",
  fechaN: "1995-06-15",
  contrasena: process.env.DEMO_PASSWORD ?? "Demo12345",
};

if (!BASE || !KEY) {
  console.error(
    "Faltan API_BASE_URL y API_KEY. Defínelas en .env.local (ver .env.example).",
  );
  process.exit(1);
}

let requests = 0;

async function call(method, path, { body, user } = {}) {
  requests += 1;
  const headers = { accept: "application/json", "x-api-key": KEY };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (user) {
    headers["x-mw-user"] = String(user.id);
    if (user.scopes?.length) headers["x-mw-scopes"] = user.scopes.join(",");
  }
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return {
    status: response.status,
    ok: response.ok && json?.ok !== false,
    json,
  };
}

function must(result, what) {
  if (!result.ok) {
    const detail =
      result.json?.mensaje ??
      result.json?.error?.mensaje ??
      `HTTP ${result.status}`;
    throw new Error(`${what}: ${detail}`);
  }
  return result.json?.data;
}

/** Fecha a las 12:00 de Ciudad de México (18:00 UTC), `offsetDays` desde hoy. */
function isoDay(offsetDays) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  date.setUTCHours(18, 0, 0, 0);
  return date.toISOString();
}

function firstOfMonth(monthsAgo = 0) {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1, 18, 0, 0),
  ).toISOString();
}

async function catalog(path, user, idKey) {
  const result = await call("GET", `${path}?pagina=1&tamanoPagina=100`, {
    user,
  });
  const rows = must(result, `catálogo ${path}`) ?? [];
  return rows.map((row) => row[idKey]).filter((id) => typeof id === "number");
}

const pick = (ids, index) => (ids.length ? ids[index % ids.length] : undefined);

async function main() {
  console.log(`Backend: ${BASE}`);

  // 1. Usuario: registrar (si ya existe, no pasa nada) e iniciar sesión.
  const registro = await call("POST", "/api/v1/auth/registro", { body: DEMO });
  if (registro.ok) console.log("Usuario demo creado.");
  else if (
    registro.status === 409 ||
    /ya est.{1,2} registrado/i.test(registro.json?.mensaje ?? "")
  )
    console.log("El usuario demo ya existía.");
  else must(registro, "registro");

  const acceso = must(
    await call("POST", "/api/v1/auth/acceso", {
      body: { correo: DEMO.correo, contrasena: DEMO.contrasena },
    }),
    "acceso",
  );
  const user = {
    id: acceso.usuario.usuarioId,
    // El registro del backend no concede `ahorro:*`; el front los agrega
    // (ver src/lib/api/scopes.ts).
    scopes: [
      ...new Set([
        ...(acceso.usuario.scopes ?? []),
        "ahorro:leer",
        "ahorro:escribir",
      ]),
    ],
  };

  // 2. Si ya tiene datos, no se duplican.
  const existentes = await call(
    "GET",
    "/api/v1/ingresos?pagina=1&tamanoPagina=1",
    { user },
  );
  const total = existentes.json?.meta?.paginacion?.total ?? 0;
  if (total > 0 && !FORCE) {
    console.log(
      `El usuario demo ya tiene ${total} ingreso(s). No se agregó nada (usa --force para agregar).`,
    );
    return;
  }

  // 3. Catálogos: se usan los que existan, sin depender de sus nombres.
  const tiposIngreso = await catalog(
    "/api/v1/catalogos/tipos-ingreso",
    user,
    "tipoIngresoId",
  );
  const tiposEgreso = await catalog(
    "/api/v1/catalogos/tipos-egreso",
    user,
    "tipoEgresoId",
  );
  const procedencias = await catalog(
    "/api/v1/catalogos/procedencias",
    user,
    "procedenciaId",
  );
  const destinos = await catalog(
    "/api/v1/catalogos/destinos",
    user,
    "destinoId",
  );
  if (!tiposIngreso.length || !tiposEgreso.length) {
    throw new Error("El backend no devolvió tipos de ingreso o de egreso.");
  }

  // 4. Fecha de corte: el primer día del mes (para que haya balance).
  must(
    await call("POST", "/api/v1/ahorro/fechas-corte", {
      user,
      body: { fechaCorte: firstOfMonth(0) },
    }),
    "fecha de corte",
  );

  // 5. Ingresos: dos meses.
  const ingresos = [
    ["Sueldo quincena", 18500, -3, 0],
    ["Sueldo quincena", 18500, -18, 0],
    ["Proyecto freelance", 4200.5, -9, 2],
    ["Reembolso de gastos", 850, -22, 1],
    ["Sueldo quincena", 18500, -33, 0],
    ["Venta de artículos", 1300, -40, 3],
  ];
  for (const [descripcion, monto, dias, i] of ingresos) {
    must(
      await call("POST", "/api/v1/ingresos", {
        user,
        body: {
          tipoId: pick(tiposIngreso, i),
          ...(procedencias.length
            ? { procedenciaId: pick(procedencias, i) }
            : {}),
          monto,
          descripcion,
          fechaInicio: isoDay(dias),
        },
      }),
      `ingreso "${descripcion}"`,
    );
  }

  // 6. Egresos: variados, para que la gráfica por categoría tenga forma.
  const egresos = [
    ["Renta del departamento", 7500, -2, 0],
    ["Despensa semanal", 1280.4, -4, 1],
    ["Gasolina", 650, -6, 2],
    ["Luz y agua", 540.75, -8, 3],
    ["Cine y cena", 480, -10, 4],
    ["Despensa semanal", 1195.2, -12, 1],
    ["Internet", 399, -15, 3],
    ["Renta del departamento", 7500, -32, 0],
    ["Despensa semanal", 1340, -34, 1],
    ["Gasolina", 700, -37, 2],
    ["Suscripciones", 289, -20, 4],
    ["Farmacia", 365.9, -26, 5],
  ];
  for (const [descripcion, monto, dias, i] of egresos) {
    must(
      await call("POST", "/api/v1/egresos", {
        user,
        body: {
          tipoId: pick(tiposEgreso, i),
          ...(destinos.length ? { destinoId: pick(destinos, i) } : {}),
          monto,
          descripcion,
          fechaInicio: isoDay(dias),
        },
      }),
      `egreso "${descripcion}"`,
    );
  }

  // 7. Metas: se crean y después se les registra lo ahorrado.
  const metas = [
    ["Viaje a Oaxaca", 12000, 7800],
    ["Fondo de emergencia", 50000, 18500],
    ["Laptop nueva", 22000, 22000],
  ];
  for (const [nombre, montoObjetivo, ahorroReal] of metas) {
    const creada = must(
      await call("POST", "/api/v1/metas", {
        user,
        body: {
          usuarioId: user.id,
          nombre,
          montoObjetivo,
          fechaInicio: firstOfMonth(2),
          activa: true,
        },
      }),
      `meta "${nombre}"`,
    );
    must(
      await call("PATCH", `/api/v1/metas/${creada.metaId}`, {
        user,
        body: { ahorroReal },
      }),
      `ahorro de "${nombre}"`,
    );
  }

  // 8. Inversiones.
  const inversiones = [
    ["CETES a 28 días", 5000, 10.2],
    ["Fondo de inversión indexado", 12000, 8.5],
  ];
  for (const [objetivo, monto, tasaInteresPorc] of inversiones) {
    must(
      await call("POST", "/api/v1/inversiones", {
        user,
        body: {
          ...(destinos.length ? { destinoId: pick(destinos, 0) } : {}),
          monto,
          objetivo,
          fechaInicio: firstOfMonth(1),
          fechaFin: null,
          tasaInteresPorc,
        },
      }),
      `inversión "${objetivo}"`,
    );
  }

  console.log(
    `Listo: ${ingresos.length} ingresos, ${egresos.length} egresos, ${metas.length} metas, ${inversiones.length} inversiones y una fecha de corte (${requests} peticiones).`,
  );
  console.log(`Entra con ${DEMO.correo} / ${DEMO.contrasena}`);
}

main().catch((error) => {
  console.error(`\nNo se pudo terminar: ${error.message}`);
  process.exit(1);
});
