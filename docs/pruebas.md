# Pruebas

| Tipo                       | Herramienta              | Comando            | Qué cubre                                                          |
| -------------------------- | ------------------------ | ------------------ | ------------------------------------------------------------------ |
| Unitarias y de componentes | Vitest + Testing Library | `npm test`         | Lógica pura, esquemas de formularios y componentes clave           |
| Punta a punta              | Playwright (Chromium)    | `npm run test:e2e` | Registro → crear un egreso → verlo en el dashboard → cerrar sesión |

`npm run test:watch` deja Vitest en modo observador.

## Unitarias y de componentes (`src/**/*.test.ts(x)`)

| Archivo                                               | Qué verifica                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/lib/format.test.ts`                              | Dinero en MXN, signo, fechas en hora de México, `dateInputToIso`, rango del mes |
| `src/lib/api/envelope.test.ts`                        | Los 3 formatos de error y los 2 de éxito del backend, `traceId`                 |
| `src/lib/api/backend.test.ts`                         | Rutas permitidas del proxy; `auth` y los intentos de salirse de la ruta         |
| `src/lib/auth/token.test.ts`                          | Firma, caducidad, manipulación y clave incorrecta de la cookie de sesión        |
| `src/lib/auth/schemas.test.ts`                        | Reglas de login, registro, perfil y cambio de contraseña                        |
| `src/lib/movimientos/schema.test.ts`                  | Validación del monto y cuerpos de alta y edición (ingresos vs. egresos)         |
| `src/lib/metas/schema.test.ts`                        | Reglas de metas y cuerpos de alta y edición                                     |
| `src/components/auth/login-form.test.tsx`             | Validación, enlace error–campo, envío y error del servidor                      |
| `src/components/movimientos/movimiento-form.test.tsx` | Formulario completo con catálogos simulados, cuerpo enviado y error por campo   |
| `src/components/states/states.test.tsx`               | Cargando, vacío y error: roles, acción y reintento                              |

Convenciones:

- `server-only` se sustituye por un stub (`tests/stubs/server-only.ts`) para poder probar lógica de servidor.
- Las acciones de servidor (`@/lib/auth/actions`) se simulan con `vi.mock`.
- La red se simula con `vi.stubGlobal("fetch", ...)`.

## Punta a punta (`e2e/`)

`playwright.config.ts` levanta solo lo que necesita:

1. El **backend simulado** (`mocks/backend.mjs`, puerto 4010).
2. La **app compilada** (`npm run build && npm run start`, puerto 3100) apuntando al simulado.

No toca Railway ni necesita la `API_KEY`. Los datos del simulado viven en memoria y cada corrida usa un correo nuevo.

Para correrlo en local:

```cmd
npx playwright install chromium
npm run test:e2e
```

## En el CI

`.github/workflows/ci.yml` tiene dos jobs:

- **`checks`**: `lint`, `format:check`, `test` (Vitest) y `build`.
- **`e2e`**: instala Chromium y corre Playwright. Si falla, sube las trazas como artefacto durante 7 días.

## Lo que las pruebas no cubren

- Que el **backend real** responda como el simulado. Las pruebas de punta a punta validan el front contra los contratos que leí del backend, no contra Railway.
- Accesibilidad con lector de pantalla y dispositivos reales (ver `docs/accesibilidad.md`).
- Los flujos de metas, inversiones, fechas de corte, perfil y recuperación de contraseña no tienen prueba de punta a punta; se verificaron con scripts manuales de navegador al construirlos.
