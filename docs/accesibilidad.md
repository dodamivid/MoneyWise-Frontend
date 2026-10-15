# Auditoría de accesibilidad y pulido

Revisión contra **WCAG 2.2 nivel AA** del front de MoneyWise (issue #14). Se hizo con la guía del skill `accessibility-audit` y pruebas automatizadas en un navegador.

## Alcance y método

| Capa                 | Cómo                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Automática           | **axe-core 4.10.2** (etiquetas `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` y `best-practice`)                            |
| Estados cubiertos    | Las 7 pantallas privadas y las 5 públicas, en **modo claro y oscuro**, más el formulario de alta y la confirmación de baja abiertos |
| Reflow (1.4.10)      | Viewport de 320 px en las 7 pantallas privadas                                                                                      |
| Foco visible (2.4.7) | 14 pulsaciones de Tab por pantalla; se revisa anillo de foco y tamaño del objetivo (≥ 24 px, 2.5.8)                                 |
| Código               | Búsqueda de colores escritos a mano, textos genéricos ("OK", "Enviar"), cursivas y degradados                                       |

## Hallazgos y correcciones

| #   | Hallazgo                                                                                               | WCAG  | Gravedad | Corrección                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------ | ----- | -------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | Enlace activo del menú: coral sobre tinte con contraste **4.35:1**                                     | 1.4.3 | Alta     | El texto del enlace activo usa `text-foreground`; el coral queda en el ícono y el fondo.                     |
| 2   | Gráficas: contenedor `aria-hidden` con elementos enfocables dentro (capa de accesibilidad de Recharts) | 4.1.2 | Alta     | `accessibilityLayer={false}` y `role="img"` con `aria-label` que resume los datos; la tabla sigue debajo.    |
| 3   | Botón destructivo en modo oscuro: **4.23:1**                                                           | 1.4.3 | Alta     | `--destructive` más claro en oscuro (`oklch(0.78 0.17 22)`) y más profundo en claro (`oklch(0.53 0.22 27)`). |
| 4   | `<input type="date">` sin anillo de foco visible (el foco cae en un sub-campo)                         | 2.4.7 | Alta     | Regla global `input[type="date"]:focus-within` en `globals.css`.                                             |
| 5   | Títulos de tarjeta (`CardTitle`) sin rol de encabezado: las pantallas de acceso no tenían `h1`         | 1.3.1 | Alta     | `role="heading"` con `aria-level` en cada uso (no se editó el componente de shadcn).                         |
| 6   | La acción con enlace del estado vacío tenía rol de botón                                               | 4.1.2 | Moderada | Se renderiza un `<Link>` real con la apariencia del botón.                                                   |
| 7   | El modo oscuro estaba definido en los tokens pero nada lo activaba                                     | —     | Moderada | Script en `<head>` que aplica la clase `dark` según `prefers-color-scheme`, sin destello.                    |
| 8   | Sin respeto explícito de `prefers-reduced-motion` para las animaciones de los diálogos                 | 2.3.3 | Moderada | Regla global que reduce animaciones y transiciones a ~0 ms.                                                  |
| 9   | Casilla "Meta activa" de 16 px                                                                         | 2.5.8 | Baja     | 20 px y etiqueta asociada.                                                                                   |
| 10  | Mensaje de error genérico "Algo salió mal"                                                             | —     | Baja     | "No pudimos completar la operación. Inténtalo de nuevo en unos minutos."                                     |

## Resultado después de corregir

- **axe-core: 0 violaciones en 28 estados** (14 en modo claro y 14 en oscuro, incluidos los diálogos abiertos).
- **Reflow a 320 px**: ninguna pantalla desborda horizontalmente (`scrollWidth` = `clientWidth`).
- **Foco por teclado**: todos los elementos interactivos muestran anillo de foco y miden al menos 24 px. El único elemento marcado, `nextjs-portal`, es la herramienta de desarrollo de Next.js y no existe en producción.

## Lo que ya estaba bien

- `lang="es-MX"`, un `h1` por pantalla, enlace "Saltar al contenido" y `aria-current="page"` en la navegación.
- Campos con etiqueta visible, ayuda y error enlazados con `aria-describedby`; el error lleva ícono y texto, no solo color.
- Ingresos y egresos llevan signo y flecha además del color; las metas, porcentaje y barra con `role="progressbar"`.
- Estados de carga con `role="status"`, de error con `role="alert"`.
- Diálogos con trampa de foco y cierre con Escape (Base UI).
- Sin colores escritos a mano fuera de `globals.css`, sin cursivas en títulos y sin degradados.

## Lo que NO se pudo verificar

Esta auditoría es automatizada y por inspección del DOM. Falta:

| Pendiente                                      | Por qué importa                                                                                                      |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Lector de pantalla real** (NVDA o VoiceOver) | axe no puede juzgar si lo que se anuncia tiene sentido ni el orden de lectura.                                       |
| **Móvil real**                                 | Se probó con viewports de 320 y 390 px, no con un teléfono: gestos, teclado virtual y selector de fecha del sistema. |
| **Zoom al 200 % y espaciado de texto**         | Se verificó el reflow a 320 px, no el aumento del tamaño de fuente del sistema.                                      |
| **Contraste con datos reales**                 | Los colores se midieron; los textos largos o nombres muy largos de categorías podrían desbordar la gráfica.          |
| **Impeccable**                                 | El CLAUDE.md lo menciona "si está instalado"; no está instalado, así que no se usó.                                  |

## Cómo repetir la auditoría

1. Levantar el simulado (`npm run mock:api`) y la app (`npm run dev`) con `.env.local` apuntando a él.
2. Cargar `axe-core` en cada pantalla (extensión **axe DevTools** o el paquete `axe-core`) con las etiquetas WCAG 2.2 AA.
3. Repetirlo con `prefers-color-scheme: dark` y con los diálogos abiertos.
