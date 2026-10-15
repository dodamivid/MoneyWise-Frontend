# Capa de API

El navegador nunca habla con el backend de Railway. Todo pasa por un proxy de Next.js que agrega la `x-api-key` en el servidor.

```
Navegador ──► /api/mw/...  (route handler de Next.js) ──► Backend en Railway
              agrega x-api-key + identidad de sesión
```

## Archivos

| Archivo                             | Qué hace                                                          |
| ----------------------------------- | ----------------------------------------------------------------- |
| `src/app/api/mw/[...path]/route.ts` | Proxy. Valida la ruta, llama al backend y devuelve el resultado.  |
| `src/lib/api/backend.ts`            | `callBackend()` y `resolveBackendPath()` (solo servidor).         |
| `src/lib/api/config.ts`             | Lee `API_BASE_URL` y `API_KEY` (solo servidor).                   |
| `src/lib/api/identity.ts`           | Identidad `x-mw-user` / `x-mw-scopes` desde la sesión (issue #4). |
| `src/lib/api/envelope.ts`           | Normaliza respuestas y errores. Lo usan proxy y cliente.          |
| `src/lib/api/client.ts`             | `api.get/post/patch/put/delete` para usar en el navegador.        |
| `src/lib/api/types/*.ts`            | Tipos por módulo, tomados de los DTOs del backend.                |

## Rutas del proxy

| Navegador                 | Backend                |
| ------------------------- | ---------------------- |
| `/api/mw/health`          | `/health`              |
| `/api/mw/v1/<módulo>/...` | `/api/v1/<módulo>/...` |
| `/api/mw/users/:id`       | `/api/users/:id`       |

Módulos permitidos de `v1`: `ingresos`, `egresos`, `inversiones`, `metas`, `catalogos`, `dashboard`, `ahorro`, `version`.

`v1/auth` **no** pasa por el proxy: el login y el registro los atiende el servidor (issue #4) para que el token no llegue al navegador. Cualquier otra ruta responde 404.

### Rutas del backend por módulo

| Módulo          | Rutas                                                                              |
| --------------- | ---------------------------------------------------------------------------------- |
| Ingresos        | `GET/POST /api/v1/ingresos`, `GET/PATCH/DELETE /api/v1/ingresos/:id`               |
| Egresos         | `GET/POST /api/v1/egresos`, `GET/PATCH/DELETE /api/v1/egresos/:id`                 |
| Inversiones     | `GET/POST /api/v1/inversiones`, `GET/PATCH/DELETE /api/v1/inversiones/:id`         |
| Metas           | `GET/POST /api/v1/metas`, `GET/PATCH/DELETE /api/v1/metas/:id`                     |
| Catálogos       | `/api/v1/catalogos/{destinos,frecuencias,procedencias,tipos-ingreso,tipos-egreso}` |
| Dashboard       | `/api/v1/dashboard/{resumen,balance,metas-vs-ahorro}`                              |
| Fechas de corte | `GET/POST /api/v1/ahorro/fechas-corte`, `DELETE /api/v1/ahorro/fechas-corte/:id`   |
| Usuarios        | `GET/PUT /api/users/:id`, `PATCH /api/users/:id/contrasena`                        |

> `README_API.md` del backend menciona `GET /api/v1/catalogos`, pero esa ruta no existe: los catálogos se piden por separado.

## Formato único de respuesta

El backend mezcla formatos (`{ok,data}`, `{status,data}`, `mensaje`/`message`, `error.mensaje`). El proxy los convierte a:

```ts
type ApiResult<T> =
  | { ok: true; status: number; data: T; meta?: { paginacion?: {...} }; traceId?: string }
  | { ok: false; error: { status: number; mensaje: string; codigo?: string; traceId?: string; detalles?: unknown } };
```

## Uso

En un componente de cliente:

```ts
import { api } from "@/lib/api/client";
import type { FrecuenciaDTO } from "@/lib/api/types";

const result = await api.get<FrecuenciaDTO[]>("/v1/catalogos/frecuencias");
if (!result.ok) {
  // result.error.mensaje se puede mostrar; result.error.traceId sirve para reportar.
}
```

En el servidor (server components, server actions):

```ts
import { callBackend } from "@/lib/api/backend";
const result = await callBackend<FrecuenciaDTO[]>({
  method: "GET",
  path: "/api/v1/catalogos/frecuencias",
});
```

## Seguridad

- `API_BASE_URL` y `API_KEY` no llevan `NEXT_PUBLIC_`, y `config.ts` usa `server-only`: si un componente de cliente intenta importarlo, el build falla.
- El proxy **no reenvía ningún header del navegador**. Solo manda los suyos: `x-api-key`, `x-correlation-id` y, con sesión, `x-mw-user` y `x-mw-scopes`. Esto importa porque el backend confía en esos dos headers: si el navegador pudiera fijarlos, cualquiera se haría pasar por otro usuario.
- Un 401 del backend por `x-api-key` se muestra como error de configuración, no como "inicia sesión".

## Errores y `traceId`

El backend responde con `X-Trace-Id`. El proxy lo conserva en `error.traceId` y en el header de respuesta. Al reportar un fallo, ese identificador permite encontrar la petición en los logs del backend.
