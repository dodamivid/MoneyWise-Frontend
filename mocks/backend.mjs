/**
 * Backend simulado de MoneyWise para desarrollo y pruebas.
 *
 * Imita los contratos de `dodamivid/MoneyWise-Integracion` (DTOs, formatos de
 * éxito y de error, paginación, headers `x-api-key` y `x-mw-user`) con datos en
 * memoria. Sirve para trabajar sin la key de Railway y sin tocar la base real.
 *
 *   npm run mock:api
 *   API_BASE_URL=http://localhost:4010  API_KEY=mock-key
 *
 * No es el backend: no valida todo lo que valida el real. Cuando algo se
 * contradiga, manda el backend (ver docs/mock-backend.md).
 */
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.MOCK_PORT ?? 4010);
const API_KEY = process.env.MOCK_API_KEY ?? "mock-key";

// ── Estado en memoria ───────────────────────────────────────────────────────
const catalogs = {
  destinos: ["Cuenta de ahorro", "Efectivo", "Tarjeta de débito"],
  procedencias: ["Empleo", "Freelance", "Regalo", "Venta"],
  "tipos-ingreso": ["Sueldo", "Bono", "Extra", "Reembolso"],
  "tipos-egreso": ["Renta", "Súper", "Transporte", "Servicios", "Ocio"],
  frecuencias: ["Diario", "Semanal", "Quincenal", "Mensual", "Anual"],
};
const idField = {
  destinos: "destinoId",
  procedencias: "procedenciaId",
  "tipos-ingreso": "tipoIngresoId",
  "tipos-egreso": "tipoEgresoId",
  frecuencias: "frecuenciaId",
};

const users = new Map(); // correo -> { usuarioId, ...perfil, contrasena }
let nextUserId = 1;
const stores = new Map(); // usuarioId -> datos del usuario
let nextId = 1000;

function storeFor(userId) {
  const key = String(userId);
  if (!stores.has(key)) {
    const iso = (d) => new Date(d).toISOString();
    const now = new Date();
    const m = (day) =>
      iso(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day, 18, 0, 0));
    stores.set(key, {
      ingresos: [
        {
          ingresoId: nextId++,
          tipoId: 1,
          procedenciaId: 1,
          monto: 20000,
          descripcion: "Sueldo quincena",
          fechaInicio: m(1),
          fechaFin: null,
        },
        {
          ingresoId: nextId++,
          tipoId: 3,
          procedenciaId: 2,
          monto: 3200.5,
          descripcion: "Proyecto freelance",
          fechaInicio: m(10),
          fechaFin: null,
        },
      ],
      egresos: [
        {
          egresoId: nextId++,
          tipoId: 1,
          destinoId: 1,
          monto: 6500,
          descripcion: "Renta",
          fechaInicio: m(2),
          fechaFin: null,
        },
        {
          egresoId: nextId++,
          tipoId: 2,
          destinoId: 3,
          monto: 1020.1,
          descripcion: "Súper semanal",
          fechaInicio: m(4),
          fechaFin: null,
        },
        {
          egresoId: nextId++,
          tipoId: 4,
          destinoId: 1,
          monto: 540,
          descripcion: "Luz y agua",
          fechaInicio: m(6),
          fechaFin: null,
        },
      ],
      metas: [
        {
          metaId: nextId++,
          nombre: "Viaje a Oaxaca",
          montoObjetivo: 10000,
          ahorroReal: 6000,
          activa: true,
          fechaInicio: m(1),
        },
        {
          metaId: nextId++,
          nombre: "Fondo de emergencia",
          montoObjetivo: 40000,
          ahorroReal: 10000,
          activa: true,
          fechaInicio: m(1),
        },
      ],
      inversiones: [
        {
          inversionId: nextId++,
          destinoId: 1,
          monto: 5000,
          objetivo: "CETES 28 días",
          fechaInicio: m(3),
          fechaFin: null,
          tasaInteresPorc: 10.2,
        },
      ],
      fechasCorte: [],
    });
  }
  return stores.get(key);
}

// ── Utilidades ──────────────────────────────────────────────────────────────
const stamp = () => new Date().toISOString();

function send(res, status, body, traceId) {
  res.writeHead(status, {
    "content-type": "application/json",
    "x-trace-id": traceId,
  });
  res.end(body === undefined ? "" : JSON.stringify(body));
}

const ok = (data, meta) => ({ ok: true, data, ...(meta ? { meta } : {}) });
const moduleError = (codigo, mensaje, detalles) => ({
  ok: false,
  error: { codigo, mensaje, ...(detalles ? { detalles } : {}) },
});
const issue = (path, message) => ({ code: "custom", path: [path], message });

function paginate(rows, query) {
  const pagina = Math.max(1, Number(query.get("pagina") ?? 1));
  const tamano = Math.min(
    100,
    Math.max(1, Number(query.get("tamanoPagina") ?? 20)),
  );
  const start = (pagina - 1) * tamano;
  return {
    data: rows.slice(start, start + tamano),
    meta: { paginacion: { pagina, tamanoPagina: tamano, total: rows.length } },
  };
}

function sortRows(rows, orden, defaultOrder) {
  const [field, dir = "desc"] = (orden || defaultOrder).split(":");
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = a[field];
    const y = b[field];
    return (x > y ? 1 : x < y ? -1 : 0) * sign;
  });
}

const isIso = (v) => typeof v === "string" && !Number.isNaN(Date.parse(v));
const twoDecimals = (n) => Number(n.toFixed(2)) === n;

function validateMovimiento(body, { partial, extraIdField }) {
  const issues = [];
  const has = (k) => body[k] !== undefined;
  if (!partial || has("tipoId")) {
    if (!Number.isInteger(body.tipoId) || body.tipoId <= 0)
      issues.push(issue("tipoId", "tipoId debe ser positivo"));
  }
  if (!partial || has("monto")) {
    if (typeof body.monto !== "number" || body.monto <= 0)
      issues.push(issue("monto", "monto debe ser positivo"));
    else if (!twoDecimals(body.monto))
      issues.push(issue("monto", "monto debe tener maximo 2 decimales"));
  }
  if (!partial || has("fechaInicio")) {
    if (!isIso(body.fechaInicio))
      issues.push(issue("fechaInicio", "Fecha debe estar en formato ISO-8601"));
  }
  if (has("fechaFin") && body.fechaFin !== null && !isIso(body.fechaFin)) {
    issues.push(issue("fechaFin", "Fecha debe estar en formato ISO-8601"));
  }
  if (
    isIso(body.fechaInicio) &&
    isIso(body.fechaFin) &&
    Date.parse(body.fechaInicio) > Date.parse(body.fechaFin)
  ) {
    issues.push(issue("fechaInicio", "fechaInicio debe ser <= fechaFin"));
  }
  if (typeof body.descripcion === "string" && body.descripcion.length > 255) {
    issues.push(
      issue("descripcion", "descripcion no puede exceder 255 caracteres"),
    );
  }
  if (
    extraIdField &&
    has(extraIdField) &&
    body[extraIdField] !== null &&
    (!Number.isInteger(body[extraIdField]) || body[extraIdField] <= 0)
  ) {
    issues.push(issue(extraIdField, `${extraIdField} debe ser positivo`));
  }
  return issues;
}

function inRange(row, query) {
  const desde = query.get("desde");
  const hasta = query.get("hasta");
  const t = Date.parse(row.fechaInicio);
  if (desde && t < Date.parse(desde)) return false;
  if (hasta && t > Date.parse(hasta)) return false;
  return true;
}

// ── CRUD genérico de movimientos (ingresos / egresos / inversiones) ─────────
function crudRoutes(
  name,
  { listKey, idKey, extraIdField, validator, build, patch },
) {
  return {
    list(store, query, userId) {
      let rows = store[listKey].filter((row) => inRange(row, query));
      const tipoId = query.get("tipoId");
      if (tipoId) rows = rows.filter((row) => String(row.tipoId) === tipoId);
      rows = sortRows(rows, query.get("orden"), "fechaInicio:desc");
      return paginate(
        rows.map((row) => ({
          creadoEn: stamp(),
          actualizadoEn: stamp(),
          ...row,
          usuarioId: Number(userId),
        })),
        query,
      );
    },
    create(store, body) {
      const issues = validator(body, { partial: false, extraIdField });
      if (issues.length)
        return {
          status: 422,
          body: moduleError(
            "DATOS_INVALIDOS",
            `Datos de ${name} invalidos`,
            issues,
          ),
        };
      const row = {
        [idKey]: nextId++,
        ...build(body),
        creadoEn: stamp(),
        actualizadoEn: stamp(),
      };
      store[listKey].push(row);
      return { status: 201, body: ok({ [idKey]: row[idKey] }) };
    },
    get(store, id, userId) {
      const row = store[listKey].find((r) => String(r[idKey]) === id);
      if (!row)
        return {
          status: 404,
          body: moduleError("NO_ENCONTRADO", `${name} no encontrado`),
        };
      return { status: 200, body: ok({ ...row, usuarioId: Number(userId) }) };
    },
    update(store, id, body) {
      const row = store[listKey].find((r) => String(r[idKey]) === id);
      if (!row)
        return {
          status: 404,
          body: moduleError("NO_ENCONTRADO", `${name} no encontrado`),
        };
      if (Object.keys(body).length === 0) {
        return {
          status: 422,
          body: moduleError(
            "DATOS_INVALIDOS",
            "Debe proporcionar al menos un campo para actualizar",
          ),
        };
      }
      const issues = validator(body, { partial: true, extraIdField });
      if (issues.length)
        return {
          status: 422,
          body: moduleError(
            "DATOS_INVALIDOS",
            `Datos de ${name} invalidos`,
            issues,
          ),
        };
      Object.assign(row, patch(body), { actualizadoEn: stamp() });
      return { status: 200, body: ok({ actualizado: true }) };
    },
    remove(store, id) {
      const index = store[listKey].findIndex((r) => String(r[idKey]) === id);
      if (index === -1)
        return {
          status: 404,
          body: moduleError("NO_ENCONTRADO", `${name} no encontrado`),
        };
      store[listKey].splice(index, 1);
      return { status: 200, body: ok({ eliminado: true }) };
    },
  };
}

const pick = (body, keys) =>
  Object.fromEntries(
    keys.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]),
  );
const ingresos = crudRoutes("ingreso", {
  listKey: "ingresos",
  idKey: "ingresoId",
  extraIdField: "procedenciaId",
  validator: validateMovimiento,
  build: (b) => ({
    tipoId: b.tipoId,
    procedenciaId: b.procedenciaId ?? null,
    monto: b.monto,
    descripcion: b.descripcion ?? null,
    fechaInicio: b.fechaInicio,
    fechaFin: b.fechaFin ?? null,
  }),
  patch: (b) =>
    pick(b, [
      "tipoId",
      "procedenciaId",
      "monto",
      "descripcion",
      "fechaInicio",
      "fechaFin",
    ]),
});
const egresos = crudRoutes("egreso", {
  listKey: "egresos",
  idKey: "egresoId",
  extraIdField: "destinoId",
  // El backend real: PATCH no acepta null en destinoId ni en descripcion.
  validator: (body, options) => {
    const issues = validateMovimiento(body, options);
    if (options.partial) {
      for (const key of ["destinoId", "descripcion"]) {
        if (body[key] === null) {
          issues.push(issue(key, `${key} no puede ser null`));
        }
      }
    }
    return issues;
  },
  build: (b) => ({
    tipoId: b.tipoId,
    destinoId: b.destinoId ?? null,
    monto: b.monto,
    descripcion: b.descripcion ?? null,
    fechaInicio: b.fechaInicio,
    fechaFin: b.fechaFin ?? null,
  }),
  patch: (b) =>
    pick(b, [
      "tipoId",
      "destinoId",
      "monto",
      "descripcion",
      "fechaInicio",
      "fechaFin",
    ]),
});

function validateInversion(body, { partial }) {
  const issues = [];
  const has = (k) => body[k] !== undefined;
  if (!partial || has("monto")) {
    if (typeof body.monto !== "number" || body.monto <= 0)
      issues.push(issue("monto", "El monto debe ser mayor a 0"));
  }
  if (!partial || has("objetivo")) {
    if (typeof body.objetivo !== "string" || body.objetivo.length < 1)
      issues.push(issue("objetivo", "El objetivo es obligatorio"));
    else if (body.objetivo.length > 120)
      issues.push(
        issue("objetivo", "El objetivo debe tener máximo 120 caracteres"),
      );
  }
  if (!partial || has("fechaInicio")) {
    if (!isIso(body.fechaInicio))
      issues.push(issue("fechaInicio", "Formato de fecha inválido"));
  }
  if (!partial || has("tasaInteresPorc")) {
    if (
      typeof body.tasaInteresPorc !== "number" ||
      body.tasaInteresPorc < 0 ||
      body.tasaInteresPorc > 100
    ) {
      issues.push(issue("tasaInteresPorc", "La tasa debe estar entre 0 y 100"));
    }
  }
  if (
    isIso(body.fechaInicio) &&
    isIso(body.fechaFin) &&
    Date.parse(body.fechaFin) < Date.parse(body.fechaInicio)
  ) {
    issues.push(
      issue("fechaFin", "La fechaFin debe ser mayor o igual a fechaInicio"),
    );
  }
  return issues;
}
const inversiones = crudRoutes("inversion", {
  listKey: "inversiones",
  idKey: "inversionId",
  validator: validateInversion,
  build: (b) => ({
    destinoId: b.destinoId ?? null,
    monto: b.monto,
    objetivo: b.objetivo,
    fechaInicio: b.fechaInicio,
    fechaFin: b.fechaFin ?? null,
    tasaInteresPorc: b.tasaInteresPorc,
  }),
  patch: (b) =>
    pick(b, [
      "destinoId",
      "monto",
      "objetivo",
      "fechaInicio",
      "fechaFin",
      "tasaInteresPorc",
    ]),
});

// ── Metas ───────────────────────────────────────────────────────────────────
const metaView = (m, userId) => ({
  ...m,
  usuarioId: Number(userId),
  porcentajeAvance:
    m.montoObjetivo > 0
      ? Math.round((m.ahorroReal / m.montoObjetivo) * 1000) / 10
      : 0,
  creadoEn: m.creadoEn ?? stamp(),
  actualizadoEn: m.actualizadoEn ?? stamp(),
});

// ── Enrutado ────────────────────────────────────────────────────────────────
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function sumBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    map.set(key, (map.get(key) ?? 0) + row.monto);
  }
  return map;
}

const server = createServer(async (req, res) => {
  const traceId = req.headers["x-correlation-id"]?.toString() || randomUUID();
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = req.method ?? "GET";
  const query = url.searchParams;

  if (path === "/health") return send(res, 200, { ok: true }, traceId);

  if (path.startsWith("/api")) {
    const provided = req.headers["x-api-key"]?.toString().trim();
    if (!provided) {
      return send(
        res,
        401,
        {
          ok: false,
          mensaje: "Missing x-api-key header",
          codigo: 401,
          traceId,
        },
        traceId,
      );
    }
    if (provided !== API_KEY) {
      return send(
        res,
        401,
        { ok: false, mensaje: "Invalid x-api-key", codigo: 401, traceId },
        traceId,
      );
    }
  }

  const body = ["POST", "PUT", "PATCH"].includes(method)
    ? await readBody(req)
    : {};
  if (body === null) {
    return send(
      res,
      400,
      { ok: false, mensaje: "JSON inválido", codigo: 400, traceId },
      traceId,
    );
  }

  // Auth (sin x-mw-user)
  if (method === "POST" && path === "/api/v1/auth/registro") {
    const required = [
      "nombre",
      "apellidoP",
      "apellidoM",
      "correo",
      "fechaN",
      "contrasena",
    ];
    const missing = required.filter((k) => !body[k]);
    if (missing.length) {
      return send(
        res,
        400,
        {
          ok: false,
          mensaje: "Datos inválidos",
          codigo: 400,
          detalles: {
            errors: missing.map((m) => ({ field: m, message: "Requerido" })),
          },
          traceId,
        },
        traceId,
      );
    }
    if (users.has(body.correo)) {
      return send(
        res,
        409,
        {
          ok: false,
          mensaje: "El correo ya está registrado",
          codigo: 409,
          traceId,
        },
        traceId,
      );
    }
    const usuarioId = nextUserId++;
    users.set(body.correo, {
      usuarioId,
      nombre: body.nombre,
      apellidoP: body.apellidoP,
      apellidoM: body.apellidoM,
      correo: body.correo,
      fechaN: body.fechaN,
      contrasena: body.contrasena,
      creadoEn: stamp(),
    });
    return send(
      res,
      201,
      ok({
        usuarioId,
        nombreCompleto: `${body.nombre} ${body.apellidoP} ${body.apellidoM}`,
        correo: body.correo,
        creadoEn: stamp(),
        scopes: [],
      }),
      traceId,
    );
  }
  if (method === "POST" && path === "/api/v1/auth/acceso") {
    const user = users.get(body.correo);
    if (!user || user.contrasena !== body.contrasena) {
      return send(
        res,
        401,
        { ok: false, mensaje: "Credenciales inválidas", codigo: 401, traceId },
        traceId,
      );
    }
    return send(
      res,
      200,
      ok({
        token: randomUUID(),
        expiraEn: 3600,
        usuario: {
          usuarioId: user.usuarioId,
          nombre: user.nombre,
          correo: user.correo,
          scopes: [
            "ingresos:leer",
            "ingresos:escribir",
            "egresos:leer",
            "egresos:escribir",
            "metas:leer",
            "metas:escribir",
            "inversiones:leer",
            "inversiones:escribir",
            "catalogos:leer",
            "ahorro:leer",
            "ahorro:escribir",
            "dashboard:leer",
            "usuarios:leer",
            "usuarios:escribir",
          ],
        },
      }),
      traceId,
    );
  }
  if (method === "POST" && path === "/api/v1/auth/olvido") {
    return send(res, 200, ok({ enviado: true }), traceId);
  }
  if (method === "POST" && path === "/api/v1/auth/restablecer") {
    return send(res, 200, ok({ restablecido: true }), traceId);
  }

  // Resto: autenticación simulada por x-mw-user (como el backend real).
  const userId = (req.headers["x-mw-user"] ?? "demo-user").toString().trim();
  if (!/^\d+$/.test(userId)) {
    return send(
      res,
      422,
      moduleError(
        "DATOS_INVALIDOS",
        "DATOS_INVALIDOS: userId del token debe ser numerico",
      ),
      traceId,
    );
  }
  const store = storeFor(userId);
  const respond = (r) => send(res, r.status, r.body, traceId);

  // Catálogos
  const catalogMatch = path.match(/^\/api\/v1\/catalogos\/([a-z-]+)$/);
  if (method === "GET" && catalogMatch && catalogs[catalogMatch[1]]) {
    const key = catalogMatch[1];
    const rows = catalogs[key].map((nombre, index) => ({
      [idField[key]]: index + 1,
      ...(key === "frecuencias" ? {} : { usuarioId: null, esPorDefecto: true }),
      nombre,
      creadoEn: stamp(),
      actualizadoEn: stamp(),
    }));
    const page = paginate(rows, query);
    return send(res, 200, ok(page.data, page.meta), traceId);
  }

  // CRUD de movimientos
  const crud = { ingresos, egresos, inversiones };
  const crudMatch = path.match(
    /^\/api\/v1\/(ingresos|egresos|inversiones)(?:\/(\d+))?$/,
  );
  if (crudMatch) {
    const handler = crud[crudMatch[1]];
    const id = crudMatch[2];
    if (!id && method === "GET") {
      // El backend real de egresos exige desde y hasta juntos.
      if (
        crudMatch[1] === "egresos" &&
        Boolean(query.get("desde")) !== Boolean(query.get("hasta"))
      ) {
        return send(
          res,
          422,
          moduleError("DATOS_INVALIDOS", "Parametros de consulta invalidos", [
            issue(
              "desde",
              "Debe proporcionar ambos 'desde' y 'hasta', y desde <= hasta",
            ),
          ]),
          traceId,
        );
      }
      const page = handler.list(store, query, userId);
      return send(res, 200, ok(page.data, page.meta), traceId);
    }
    if (!id && method === "POST") return respond(handler.create(store, body));
    if (id && method === "GET") return respond(handler.get(store, id, userId));
    if (id && method === "PATCH")
      return respond(handler.update(store, id, body));
    if (id && method === "DELETE") return respond(handler.remove(store, id));
  }

  // Metas
  const metaMatch = path.match(/^\/api\/v1\/metas(?:\/(\d+))?$/);
  if (metaMatch) {
    const id = metaMatch[1];
    if (!id && method === "GET") {
      const page = paginate(
        store.metas.map((m) => metaView(m, userId)),
        query,
      );
      return send(res, 200, ok(page.data, page.meta), traceId);
    }
    if (!id && method === "POST") {
      const issues = [];
      if (typeof body.nombre !== "string" || body.nombre.trim().length < 2)
        issues.push(
          issue("nombre", "El nombre debe tener al menos 2 caracteres"),
        );
      if (typeof body.montoObjetivo !== "number" || body.montoObjetivo <= 0)
        issues.push(issue("montoObjetivo", "montoObjetivo debe ser positivo"));
      if (issues.length)
        return send(
          res,
          422,
          moduleError("DATOS_INVALIDOS", "Datos de la meta invalidos", issues),
          traceId,
        );
      const meta = {
        metaId: nextId++,
        nombre: body.nombre.trim(),
        montoObjetivo: body.montoObjetivo,
        ahorroReal: 0,
        activa: body.activa ?? true,
        fechaInicio: body.fechaInicio ?? stamp(),
        fechaFin: body.fechaFin,
      };
      store.metas.push(meta);
      return send(res, 201, ok({ metaId: meta.metaId }), traceId);
    }
    const meta = id
      ? store.metas.find((m) => String(m.metaId) === id)
      : undefined;
    if (id && !meta)
      return send(
        res,
        404,
        moduleError("NO_ENCONTRADO", "Meta no encontrada"),
        traceId,
      );
    if (id && method === "GET")
      return send(res, 200, ok(metaView(meta, userId)), traceId);
    if (id && method === "PATCH") {
      Object.assign(
        meta,
        pick(body, [
          "nombre",
          "montoObjetivo",
          "activa",
          "fechaInicio",
          "fechaFin",
        ]),
        { actualizadoEn: stamp() },
      );
      return send(res, 200, ok({ actualizado: true }), traceId);
    }
    if (id && method === "DELETE") {
      store.metas.splice(store.metas.indexOf(meta), 1);
      return send(res, 200, ok({ eliminado: true }), traceId);
    }
  }

  // Fechas de corte
  const corteMatch = path.match(
    /^\/api\/v1\/ahorro\/fechas-corte(?:\/(\d+))?$/,
  );
  if (corteMatch) {
    const id = corteMatch[1];
    if (!id && method === "GET") {
      const rows = sortRows(
        store.fechasCorte,
        query.get("orden"),
        "fechaCorte:desc",
      ).map((r) => ({ ...r, usuarioId: userId }));
      const page = paginate(rows, query);
      return send(res, 200, ok(page.data, page.meta), traceId);
    }
    if (!id && method === "POST") {
      if (!isIso(body.fechaCorte)) {
        return send(
          res,
          422,
          moduleError(
            "DATOS_INVALIDOS",
            "fechaCorte debe estar en formato ISO-8601",
            [issue("fechaCorte", "fechaCorte debe estar en formato ISO-8601")],
          ),
          traceId,
        );
      }
      const row = {
        fechaCorteId: nextId++,
        fechaCorte: body.fechaCorte,
        creadoEn: stamp(),
      };
      store.fechasCorte.push(row);
      return send(res, 201, ok({ fechaCorteId: row.fechaCorteId }), traceId);
    }
    if (id && method === "DELETE") {
      const index = store.fechasCorte.findIndex(
        (r) => String(r.fechaCorteId) === id,
      );
      if (index === -1)
        return send(
          res,
          404,
          moduleError("NO_ENCONTRADO", "Fecha de corte no encontrada"),
          traceId,
        );
      store.fechasCorte.splice(index, 1);
      return send(res, 200, ok({ eliminado: true }), traceId);
    }
  }

  // Dashboard
  if (method === "GET" && path === "/api/v1/dashboard/resumen") {
    const desde = query.get("desde");
    const hasta = query.get("hasta");
    if (!isIso(desde) || !isIso(hasta)) {
      return send(
        res,
        422,
        moduleError("DATOS_INVALIDOS", "Parametros de consulta invalidos", [
          issue("desde", "Fecha en formato ISO-8601 inválido"),
        ]),
        traceId,
      );
    }
    const rows = (list) => list.filter((r) => inRange(r, query));
    const ing = rows(store.ingresos);
    const egr = rows(store.egresos);
    const totalIng = ing.reduce((a, r) => a + r.monto, 0);
    const totalEgr = egr.reduce((a, r) => a + r.monto, 0);
    const name = (key, id) => catalogs[key][id - 1] ?? `#${id}`;
    return send(
      res,
      200,
      ok({
        totales: {
          ingresos: totalIng,
          egresos: totalEgr,
          balance: totalIng - totalEgr,
        },
        ingresosPorTipo: [...sumBy(ing, (r) => r.tipoId)].map(
          ([tipoId, total]) => ({
            tipoId,
            tipo: name("tipos-ingreso", tipoId),
            total,
          }),
        ),
        egresosPorTipo: [...sumBy(egr, (r) => r.tipoId)].map(
          ([tipoId, total]) => ({
            tipoId,
            tipo: name("tipos-egreso", tipoId),
            total,
          }),
        ),
        ingresosPorProcedencia: [
          ...sumBy(
            ing.filter((r) => r.procedenciaId),
            (r) => r.procedenciaId,
          ),
        ].map(([procedenciaId, total]) => ({
          procedenciaId,
          procedencia: name("procedencias", procedenciaId),
          total,
        })),
        egresosPorDestino: [
          ...sumBy(
            egr.filter((r) => r.destinoId),
            (r) => r.destinoId,
          ),
        ].map(([destinoId, total]) => ({
          destinoId,
          destino: name("destinos", destinoId),
          total,
        })),
      }),
      traceId,
    );
  }
  if (method === "GET" && path === "/api/v1/dashboard/balance") {
    const latest = sortRows(
      store.fechasCorte,
      "fechaCorte:desc",
      "fechaCorte:desc",
    )[0];
    const corte = query.get("fechaCorte") ?? latest?.fechaCorte;
    if (!corte) {
      // El backend real puede responder distinto sin fecha de corte (por confirmar).
      return send(res, 200, ok(null), traceId);
    }
    const since = (r) => Date.parse(r.fechaInicio) >= Date.parse(corte);
    const ingresosAcumulados = store.ingresos
      .filter(since)
      .reduce((a, r) => a + r.monto, 0);
    const egresosAcumulados = store.egresos
      .filter(since)
      .reduce((a, r) => a + r.monto, 0);
    return send(
      res,
      200,
      ok({
        fechaCorte: corte,
        ingresosAcumulados,
        egresosAcumulados,
        balanceAcumulado: ingresosAcumulados - egresosAcumulados,
      }),
      traceId,
    );
  }
  if (method === "GET" && path === "/api/v1/dashboard/metas-vs-ahorro") {
    const metas = store.metas
      .filter((m) => m.activa)
      .map((m) => ({
        metaId: m.metaId,
        nombre: m.nombre,
        montoObjetivo: m.montoObjetivo,
        ahorroReal: m.ahorroReal,
        porcentajeAvance:
          m.montoObjetivo > 0
            ? Math.round((m.ahorroReal / m.montoObjetivo) * 1000) / 10
            : 0,
      }));
    const ahorroTotal = metas.reduce((a, m) => a + m.ahorroReal, 0);
    const objetivoTotal = metas.reduce((a, m) => a + m.montoObjetivo, 0);
    return send(
      res,
      200,
      ok({
        metas,
        resumen: {
          totalMetasActivas: metas.length,
          ahorroTotalPeriodo: ahorroTotal,
          diferenciaObjetivo: objetivoTotal - ahorroTotal,
        },
      }),
      traceId,
    );
  }

  // Usuarios
  const userMatch = path.match(/^\/api\/users\/(\d+)(\/contrasena)?$/);
  if (userMatch) {
    const profile = [...users.values()].find(
      (u) => String(u.usuarioId) === userMatch[1],
    );
    if (userMatch[1] !== userId) {
      return send(
        res,
        403,
        moduleError("PERMISO_DENEGADO", "No puedes acceder a este recurso"),
        traceId,
      );
    }
    if (!profile)
      return send(
        res,
        404,
        { ok: false, mensaje: "Usuario no encontrado", codigo: 404, traceId },
        traceId,
      );
    const view = (user) => {
      const rest = { ...user };
      delete rest.contrasena;
      return { ...rest, actualizadoEn: stamp(), activo: true };
    };
    if (method === "GET" && !userMatch[2])
      return send(res, 200, ok(view(profile)), traceId);
    if (method === "PUT" && !userMatch[2]) {
      Object.assign(
        profile,
        pick(body, ["nombre", "apellidoP", "apellidoM", "fechaN"]),
      );
      return send(
        res,
        200,
        ok({ actualizado: true, actualizadoEn: stamp() }),
        traceId,
      );
    }
    if (method === "PATCH" && userMatch[2]) {
      if (body.contrasenaActual !== profile.contrasena) {
        return send(
          res,
          401,
          {
            ok: false,
            mensaje: "La contraseña actual es incorrecta",
            codigo: 401,
            traceId,
          },
          traceId,
        );
      }
      profile.contrasena = body.contrasenaNueva;
      return send(res, 200, ok({ actualizado: true }), traceId);
    }
  }

  return send(
    res,
    404,
    {
      status: "error",
      message: `Ruta no encontrada: ${method} ${path}`,
      statusCode: 404,
    },
    traceId,
  );
});

server.listen(PORT, () => {
  console.log(
    `Backend simulado en http://localhost:${PORT}  (x-api-key: ${API_KEY})`,
  );
});
