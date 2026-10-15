# Backend simulado

`mocks/backend.mjs` imita el backend de MoneyWise con datos en memoria. Sirve para desarrollar y probar sin la `API_KEY` de Railway y sin tocar la base de prueba.

```cmd
npm run mock:api
```

En `.env.local`:

```
API_BASE_URL=http://localhost:4010
API_KEY=mock-key
SESSION_SECRET=<32 caracteres o más>
```

Para otro puerto o key: `MOCK_PORT` y `MOCK_API_KEY`.

## Qué imita

| Módulo          | Rutas                                                                                  |
| --------------- | -------------------------------------------------------------------------------------- |
| Salud           | `GET /health`                                                                          |
| Auth            | `POST /api/v1/auth/{registro,acceso,olvido,restablecer}`                               |
| Catálogos       | `GET /api/v1/catalogos/{destinos,procedencias,tipos-ingreso,tipos-egreso,frecuencias}` |
| Ingresos        | `GET/POST /api/v1/ingresos`, `GET/PATCH/DELETE /api/v1/ingresos/:id`                   |
| Egresos         | `GET/POST /api/v1/egresos`, `GET/PATCH/DELETE /api/v1/egresos/:id`                     |
| Inversiones     | `GET/POST /api/v1/inversiones`, `GET/PATCH/DELETE /api/v1/inversiones/:id`             |
| Metas           | `GET/POST /api/v1/metas`, `GET/PATCH/DELETE /api/v1/metas/:id`                         |
| Fechas de corte | `GET/POST /api/v1/ahorro/fechas-corte`, `DELETE .../:id`                               |
| Dashboard       | `GET /api/v1/dashboard/{resumen,balance,metas-vs-ahorro}`                              |
| Usuarios        | `GET/PUT /api/users/:id`, `PATCH /api/users/:id/contrasena`                            |

Respeta el `x-api-key`, el `x-mw-user` (cada usuario ve sus propios datos) y los formatos de éxito y de error del backend real, incluido el `traceId`.

## Lo que NO es

- **No es el backend.** No valida todo lo que valida el real y su comportamiento puede diferir.
- Los datos viven en memoria: se pierden al reiniciarlo.
- Algunas respuestas son suposiciones y están por confirmar contra el backend real:
  - `GET /dashboard/balance` sin fecha de corte devuelve `data: null`.
  - Los nombres de los campos de `PATCH /api/users/:id/contrasena` (`contrasenaActual` y `contrasenaNueva`).
  - Los filtros de `GET /api/v1/egresos`.

Cuando el mock y el backend real se contradigan, manda el backend: se corrige el mock.
