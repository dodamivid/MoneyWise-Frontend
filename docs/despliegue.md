# Despliegue en Vercel

> Estado: **no desplegado todavía.** Publicar en Vercel necesita tu cuenta y la `API_KEY` de Railway, así que este documento deja los pasos listos. Nada de lo de abajo se ha ejecutado.

## Antes de empezar

- [ ] El backend en Railway responde: `GET https://moneywise-integracion-production.up.railway.app/health`.
- [ ] Tienes la `API_KEY` (Railway → Variables del servicio de la API).
- [ ] Generaste un `SESSION_SECRET` nuevo para producción (no reutilices el de desarrollo):

  ```cmd
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

## Pasos

1. En Vercel: **Add New → Project** y elige `dodamivid/MoneyWise-Frontend`.
2. Framework: **Next.js** (se detecta solo). Node: **24.x** (Project Settings → General).
3. **Environment Variables** (Production y Preview), solo en el servidor:

   | Variable         | Valor                                                     |
   | ---------------- | --------------------------------------------------------- |
   | `API_BASE_URL`   | `https://moneywise-integracion-production.up.railway.app` |
   | `API_KEY`        | la `x-api-key` del backend                                |
   | `SESSION_SECRET` | el secreto de 32+ caracteres que generaste                |

   **No** agregues ninguna variable con prefijo `NEXT_PUBLIC_`: llegaría al navegador.

4. **Deploy.**
5. Región de las funciones: si el backend de Railway está en EE. UU., elige una región cercana (Project Settings → Functions) para reducir la latencia del proxy.

## Usuario demo

Con las variables de Railway en `.env.local` (`API_BASE_URL` y `API_KEY`):

```cmd
npm run seed:demo
```

Crea `demo@moneywise.app` / `Demo12345` con 6 ingresos, 12 egresos, 3 metas, 2 inversiones y una fecha de corte (≈ 35 peticiones). Si el usuario ya tiene datos, no agrega nada.

Después de crearlo, **cambia o documenta la contraseña** según dónde vayas a mostrar la demo: la contraseña del usuario demo es pública en este repositorio.

## Verificación después de desplegar

- [ ] `https://<tu-url>/login` carga y el login con el usuario demo entra al resumen.
- [ ] El resumen muestra balance, gráficas y movimientos (si no, revisa la `API_KEY` y los scopes).
- [ ] Crear y borrar un egreso funciona.
- [ ] En las herramientas del navegador (Network), ninguna petición lleva `x-api-key`: solo `/api/mw/...`.
- [ ] Buscar `API_KEY` en el código fuente que sirve el navegador (Sources) no encuentra nada.
- [ ] El job de CI está en verde en `main`.

## Revisión de secretos en el historial

Hecha el 15 de octubre de 2026 sobre el historial completo de este repositorio:

| Revisión                                               | Resultado                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| Archivos `.env*` que alguna vez se hayan versionado    | Solo `.env.example`, sin valores (`API_KEY=` y `SESSION_SECRET=` vacíos)  |
| Asignaciones `API_KEY=`, `SECRET=`, `TOKEN=` con valor | Ninguna real; solo constantes de prueba (`mock-key`, claves de los tests) |
| Claves con formato conocido (`ghp_`, `sk-`, `AKIA…`)   | Ninguna                                                                   |
| Cadenas hexadecimales largas                           | Una: el hash SHA-256 de `skills-lock.json` (no es un secreto)             |

Limitaciones: esta revisión es por patrones. No cubre el historial de los repositorios del backend ni del data lake, y no sustituye una herramienta dedicada como `gitleaks` o `trufflehog`; conviene correr una antes de hacer público el despliegue.

El `.gitignore` ignora `.env*` y versiona solo `.env.example`.

## Riesgos conocidos para una demo pública

- **Autenticación simulada en el backend.** Quien conozca un `usuarioId` no puede usarlo desde el navegador (el proxy fija la identidad desde la sesión), pero el backend en sí confía en `x-mw-user`. No expongas la `API_KEY`.
- **Base de datos de prueba compartida.** Cualquiera que se registre escribe en ella. Considera avisarlo en la demo y limpiar los datos de vez en cuando.
- **Sin límite de peticiones.** No hay rate limiting en el proxy.
- **Arranque en frío.** El primer acceso tras un rato sin tráfico puede tardar (funciones serverless y/o el servicio de Railway).
- **Correos.** El backend no envía correos: "Olvidé mi contraseña" no funciona de cara al público.
