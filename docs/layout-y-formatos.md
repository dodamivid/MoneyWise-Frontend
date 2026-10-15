# Layout, estados y formatos

## Layout de la app

Las pantallas privadas viven en `src/app/(app)/` y comparten `src/app/(app)/layout.tsx`.

| Tamaño     | Navegación                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Escritorio | Barra lateral fija con las 7 secciones, nombre y correo, y "Cerrar sesión".                                                     |
| Móvil      | Barra inferior con Resumen, Ingresos, Egresos y Metas, más un menú "Más" (Inversiones, Fecha de corte, Perfil y Cerrar sesión). |

- El enlace activo lleva `aria-current="page"`, negritas y color: no depende solo del color.
- Hay un enlace "Saltar al contenido" para navegar con teclado.
- Los elementos de navegación están en `src/components/layout/nav-items.ts`: para agregar una pantalla, se agrega ahí.
- Las pantallas aún sin construir muestran un estado vacío provisional; cada issue lo reemplaza.

## Componentes de estado

Toda pantalla maneja tres estados con los mismos componentes (`src/components/states/`):

| Componente   | Cuándo            | Props principales                                     |
| ------------ | ----------------- | ----------------------------------------------------- |
| `Loading`    | Mientras carga    | `rows`, `label` (texto para lectores de pantalla)     |
| `Empty`      | No hay datos      | `title`, `description`, `action` (`href` o `onClick`) |
| `ErrorState` | Falló la petición | `title`, `mensaje`, `traceId`, `onRetry`              |

```tsx
const result = await api.get<IngresoDTO[]>("/v1/ingresos");

if (!result.ok) {
  return (
    <ErrorState
      title="No pudimos cargar tus ingresos"
      mensaje={result.error.mensaje}
      traceId={result.error.traceId}
      onRetry={reload}
    />
  );
}
if (result.data.length === 0) {
  return (
    <Empty
      title="Aún no registras ingresos"
      description="Registra el primero para ver tu balance."
      action={{ label: "Registrar ingreso", onClick: openForm }}
    />
  );
}
```

`PageHeader` (`src/components/layout/page-header.tsx`) da el título de pantalla (`h1`) y un espacio para sus botones.

## Formatos (`src/lib/format.ts`)

| Función                             | Ejemplo                           |
| ----------------------------------- | --------------------------------- |
| `formatMoney(1234.5)`               | `$1,234.50`                       |
| `formatMoney(1234.5, { withCode })` | `$1,234.50 MXN`                   |
| `formatSignedMoney(6500, "egreso")` | `−$6,500.00`                      |
| `formatDate(iso)`                   | `5 de agosto de 2026`             |
| `formatDateShort(iso)`              | `5 ago 2026`                      |
| `formatDateTime(iso)`               | `5 de agosto de 2026 a las 12:30` |
| `formatPercent(59.6)`               | `60 %`                            |
| `dateInputToIso("2026-08-05")`      | `2026-08-05T18:00:00.000Z`        |
| `isoToDateInput(iso)`               | `2026-08-05`                      |

### Fechas y zona horaria

- Las fechas se muestran en **hora de Ciudad de México** (`America/Mexico_City`). Se fija la zona en lugar de usar la del entorno para que el servidor (UTC en Vercel) y el navegador pinten lo mismo y no haya errores de hidratación.
- **Trampa conocida:** una fecha guardada como medianoche UTC (`2026-08-05T00:00:00Z`) es el 4 de agosto a las 18:00 en México, así que se vería **un día antes**. Por eso los formularios deben usar `dateInputToIso`, que manda las 12:00 de México, y las ediciones `isoToDateInput`.
- Si los datos de prueba del backend (seeds) vienen en medianoche UTC, algunas fechas se verán un día antes. No es un error de formato: es cómo se guardaron.
