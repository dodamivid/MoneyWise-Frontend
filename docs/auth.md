# Autenticación y sesión

## Cómo funciona la autenticación del backend

El backend tiene dos capas, y ninguna es un JWT validado por módulo:

1. **`x-api-key`**: obligatoria en todo `/api`. La agrega el servidor de Next.js.
2. **Autenticación simulada** (`mockAuth`): los módulos leen los headers `x-mw-user` (id del usuario) y `x-mw-scopes` (permisos separados por coma) y **confían en ellos**. Sin `x-mw-user`, el backend usa `demo-user`.

`POST /api/v1/auth/acceso` devuelve un `token` y el `usuario` con sus `scopes`, pero los módulos de datos no validan ese token.

## Qué hace el front

```
Login ──► server action ──► POST /api/v1/auth/acceso (con x-api-key)
                │
                └─► cookie httpOnly firmada { usuarioId, nombre, correo, scopes, exp }
                                │
Petición de datos ──► /api/mw/... ──► el servidor lee la cookie y fija
                                       x-mw-user y x-mw-scopes ──► backend
```

- La **cookie `mw_session`** es `httpOnly`, `sameSite=lax`, `secure` en producción y dura 7 días. Va firmada con HMAC-SHA256 (`SESSION_SECRET`), así que no se puede editar a mano.
- **El `token` del backend no se guarda**: los módulos no lo usan, y así no hay un secreto más que proteger.
- **Los headers `x-mw-user` y `x-mw-scopes` los fija solo el servidor.** El proxy no reenvía ningún header del navegador; de lo contrario cualquiera se haría pasar por otro usuario.
- Sin sesión, el proxy de datos responde `401` con `codigo: "SIN_SESION"` (solo `/health` es público) y el cliente manda a `/login?next=...`.

## Protección de rutas

| Capa                       | Qué hace                                                                  |
| -------------------------- | ------------------------------------------------------------------------- |
| `src/proxy.ts`             | Redirige rápido: sin sesión → `/login`; con sesión en `/login` → `/`.     |
| `src/app/(app)/layout.tsx` | Vuelve a verificar la sesión en el servidor (el proxy es solo optimista). |
| `src/app/api/mw/...`       | Exige sesión para cualquier dato.                                         |

En Next.js 16 el archivo `middleware.ts` se llama `proxy.ts`.

## Variables de entorno

| Variable         | Para qué                                         |
| ---------------- | ------------------------------------------------ |
| `API_BASE_URL`   | URL del backend en Railway.                      |
| `API_KEY`        | `x-api-key` del backend (Railway → Variables).   |
| `SESSION_SECRET` | Firma la cookie de sesión. Mínimo 32 caracteres. |

Para generar `SESSION_SECRET`:

```cmd
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Archivos

| Archivo                            | Qué hace                                                         |
| ---------------------------------- | ---------------------------------------------------------------- |
| `src/lib/auth/token.ts`            | Firma y verifica el token (Web Crypto, sin dependencias).        |
| `src/lib/auth/session.ts`          | Crea, lee y borra la cookie (solo servidor).                     |
| `src/lib/auth/schemas.ts`          | Esquemas Zod de login y registro.                                |
| `src/lib/auth/actions.ts`          | Server actions: `loginAction`, `registroAction`, `logoutAction`. |
| `src/components/auth/*`            | Campos y formularios (React Hook Form + Zod).                    |
| `src/app/(auth)/login`, `registro` | Pantallas públicas.                                              |
| `src/app/(app)/`                   | Pantallas privadas.                                              |

## Limitaciones conocidas

- **Cerrar sesión borra la cookie** pero no invalida nada en el backend, porque el backend no guarda sesiones.
- Los `scopes` que se mandan son los que devuelve el login. Si el backend no incluye uno que un módulo exige (por ejemplo `dashboard:leer`), ese módulo responderá `403`.
