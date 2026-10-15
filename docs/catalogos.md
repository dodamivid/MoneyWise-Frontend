# Catálogos

Los selects de los formularios se llenan con los catálogos del backend. Se piden por separado (no existe `GET /api/v1/catalogos`).

| Clave           | Ruta del backend                  | Campo de id     |
| --------------- | --------------------------------- | --------------- |
| `destinos`      | `/api/v1/catalogos/destinos`      | `destinoId`     |
| `procedencias`  | `/api/v1/catalogos/procedencias`  | `procedenciaId` |
| `tipos-ingreso` | `/api/v1/catalogos/tipos-ingreso` | `tipoIngresoId` |
| `tipos-egreso`  | `/api/v1/catalogos/tipos-egreso`  | `tipoEgresoId`  |
| `frecuencias`   | `/api/v1/catalogos/frecuencias`   | `frecuenciaId`  |

Los ids no son uniformes entre catálogos, por eso `CATALOGOS` en `src/lib/catalogos/use-catalogo.ts` guarda el campo de cada uno.

## Reglas del backend que conviene recordar

- `destinos`, `procedencias`, `tipos-ingreso` y `tipos-egreso` tienen entradas **globales** (`usuarioId: null`, `esPorDefecto: true`) y entradas **propias** de cada persona.
- `frecuencias` es global e inmutable (Diario, Semanal, Quincenal, Mensual...). Solo administración la modifica.
- El tamaño de página máximo es 100. Se pide `tamanoPagina=100` y orden `nombre:asc`.

## Hook

```tsx
const { options, isLoading, isError, error, refetch } = useCatalogo("destinos");
// options: { value: number; label: string }[]
```

El resultado se guarda 10 minutos en el caché de TanStack Query, así que abrir varios formularios no vuelve a pedir el catálogo.

Los fallos de red y 5xx se reintentan una vez. Los 4xx (sesión, permisos) no, porque no van a cambiar solos.

## Componente

```tsx
<CatalogSelect
  id="destino"
  catalogo="destinos"
  label="Destino"
  error={errors.destinoId?.message}
  {...register("destinoId", { valueAsNumber: true })}
/>
```

Es un `<select>` nativo: teclado y lectores de pantalla funcionan sin trabajo extra, abre el selector del sistema en móvil y se conecta directo a React Hook Form.

| Estado   | Qué muestra                                                          |
| -------- | -------------------------------------------------------------------- |
| Cargando | Select deshabilitado con "Cargando opciones…" y aviso para lectores. |
| Error    | Mensaje de qué pasó, con el motivo del backend y botón "Reintentar". |
| Vacío    | "Aún no hay opciones de ... disponibles."                            |

## Formulario de prueba

`/catalogos-prueba` carga los cinco catálogos y deja elegir. **Solo existe en desarrollo**: en producción responde 404.
