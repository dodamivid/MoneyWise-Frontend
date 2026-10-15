# Diseño de MoneyWise

Este documento recoge las decisiones de diseño del front y por qué se tomaron. Los tokens ya están aplicados en `src/app/globals.css`.

## 1. Para quién y para qué

|               |                                                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| **Audiencia** | Una persona que lleva sus finanzas personales en México y no es contadora. Quiere saber rápido cómo va el mes.  |
| **Uso**       | Registrar ingresos y egresos y leer el estado del mes de un vistazo.                                            |
| **Tono**      | Utilitario con calidez. Da claridad, no ansiedad. Descartamos el "banco serio" y la app financiera con confeti. |
| **Género**    | _modern-minimal_: herramienta de producto centrada en datos, con una sola familia tipográfica y un solo acento. |

## 2. Identidad visual: tema Coral

Se evaluaron tres direcciones: Cobalt (precisa y numérica), Coral (cálida y cercana) y Hum (amable y redondeada). Se eligió **Coral** porque una app que se abre a diario debe dar gusto, y el papel cálido con un acento coral se siente personal sin dejar de ser sobrio.

### Paleta (modo claro)

| Nombre    | Rol                     | OKLCH                   | Contraste                     |
| --------- | ----------------------- | ----------------------- | ----------------------------- |
| **Papel** | Fondo                   | `oklch(0.985 0.005 75)` | —                             |
| **Tinta** | Texto                   | `oklch(0.22 0.012 55)`  | 16.6:1 sobre Papel            |
| **Bruma** | Texto secundario        | `oklch(0.48 0.02 60)`   | 6.3:1 sobre Papel             |
| **Arena** | Superficies, secundario | `oklch(0.955 0.008 75)` | —                             |
| **Coral** | Marca, botones, enlaces | `oklch(0.54 0.17 40)`   | 5.3:1 (botón) y 5.2:1 (texto) |

**Por qué un coral profundo:** un coral más vivo se ve mejor pero no llega a 4.5:1 como texto. Se bajó la luminosidad para pasar AA con margen.

**Modo oscuro:** papel `oklch(0.17 0.008 60)`, tinta `oklch(0.96 0.006 75)` y coral `oklch(0.70 0.17 42)` con texto oscuro encima. Los tokens de shadcn ya están definidos para ambos modos.

### Colores semánticos

| Semántico   | Claro                             | Oscuro                 | Contraste (claro / oscuro) | Pista que no es color     |
| ----------- | --------------------------------- | ---------------------- | -------------------------- | ------------------------- |
| **Ingreso** | `oklch(0.50 0.12 155)` verde      | `oklch(0.76 0.15 155)` | 5.4 / 9.5                  | Signo `+` y flecha ↑      |
| **Egreso**  | `oklch(0.50 0.19 12)` rosa-carmín | `oklch(0.74 0.16 15)`  | 6.4 / 7.7                  | Signo `−` y flecha ↓      |
| **Meta**    | `oklch(0.50 0.15 285)` violeta    | `oklch(0.74 0.12 285)` | 6.1 / 8.1                  | Ícono de objetivo y barra |
| **Alerta**  | texto `oklch(0.42 0.09 80)`       | `oklch(0.82 0.14 85)`  | 8.2 / 10.9                 | Ícono de aviso            |

Decisiones:

1. **El color nunca va solo.** Cada semántico lleva signo o ícono, para quien no distingue verde de rojo.
2. **Coral y egreso son cálidos y cercanos.** Se separaron unos 28° de matiz y el egreso va hacia carmín. Aun así, el coral nunca se usa para mostrar un monto y el egreso siempre lleva `−` y ↓.
3. **Egreso no es "destructivo".** `--destructive` queda para borrar y errores. Gastar no es un error.
4. **El relleno ámbar de alerta mide 1.9:1** sobre Papel. Nunca va como texto: se usa `--alerta-text` o texto Tinta sobre el relleno.

### Tokens en Tailwind

Los semánticos están registrados en `@theme inline`, así que se usan como `bg-ingreso`, `text-egreso`, `bg-meta`, `bg-alerta`, `text-alerta-text` y sus `-foreground`. Los nombres de shadcn (`primary`, `muted`, `border`…) se conservaron para no editar `src/components/ui`.

## 3. Tipografía

- **Una sola familia: Geist** (ya cargada con `next/font`). Es lo que define a Coral y evita cargar una segunda fuente.
- **Geist Mono** solo para códigos y apoyo, no para los montos principales.
- **Montos:** Geist con `font-variant-numeric: tabular-nums`, para que las columnas de dinero se alineen.
- **Titulares:** peso 600 e interletraje apretado (`-0.02em`). Sin cursivas en títulos.

| Nivel   | Tamaño                            | Uso                         |
| ------- | --------------------------------- | --------------------------- |
| Display | `clamp(2rem, 4vw + 0.5rem, 3rem)` | Balance, título de pantalla |
| Título  | `1.5rem`                          | Encabezados de sección      |
| Cuerpo  | `1rem`                            | Texto base                  |
| Apoyo   | `0.875rem`                        | Etiquetas, fechas           |

## 4. Espacio, radios y sombras

- **Espacios:** escala de 4 px (`4 · 8 · 12 · 16 · 24 · 32 · 48`), la que ya trae Tailwind.
- **Radios:** `--radius: 0.625rem` se conserva. Botones principales tipo pill (`rounded-full`), tarjetas a 12 px.
- **Sombras:** muy suaves. Las tarjetas se separan sobre todo con borde, no con sombra pesada.
- **Movimiento:** mínimo. No hay librería de animación. Se respeta `prefers-reduced-motion`.

## 5. Voz y textos

**Voz:** clara, tranquila y específica. Habla de tú. No juzga los gastos de la persona.

| Principio    | Cómo suena                                 | Cómo no suena                         |
| ------------ | ------------------------------------------ | ------------------------------------- |
| **Claro**    | "Este mes gastaste $4,320.50 MXN."         | "Tu salud financiera está en riesgo." |
| **Calmado**  | "Aún no registras egresos este mes."       | "¡Cuidado! No has registrado nada."   |
| **Práctico** | "Registra un ingreso para ver tu balance." | "No hay datos disponibles."           |

Reglas (adaptadas del español: los títulos van en minúscula salvo la primera palabra):

- **Botones:** verbo + objeto, en minúscula salvo la primera. "Guardar cambios", "Registrar ingreso", "Eliminar egreso". Nunca "OK", "Enviar" ni "Aceptar" solos.
- **Errores:** qué pasó, por qué y qué hacer. Sin culpar. "No pudimos guardar el egreso. Se perdió la conexión. Revisa tu internet y vuelve a intentarlo."
- **Éxito:** pasado, breve y específico. "Ingreso guardado."
- **Vacío:** explica por qué está vacío y qué hacer. "Aún no tienes metas. Crea una para ver tu progreso."
- **Confirmaciones destructivas:** dicen la consecuencia. "¿Eliminar este egreso? No se puede deshacer."
- **Dinero:** `$1,234.50 MXN`, con separador de miles. **Fechas:** "5 de agosto de 2026", nunca `5/8/2026`.
- **Errores de formulario:** junto al campo y con ícono. "El correo debe incluir @".

## 6. Los tres estados de toda pantalla

Cada pantalla maneja los tres estados con los mismos componentes (se construyen en el issue #5):

| Estado       | Qué muestra                                         | Ejemplo                                                      |
| ------------ | --------------------------------------------------- | ------------------------------------------------------------ |
| **Cargando** | Esqueleto con la forma del contenido, no un spinner | Filas grises donde irán los movimientos                      |
| **Vacío**    | Explicación + una acción sugerida                   | "Aún no registras ingresos. Registra el primero."            |
| **Error**    | Qué pasó y cómo resolverlo, con botón de reintento  | "No pudimos cargar tus egresos. Reintenta en unos segundos." |

## 7. Navegación

- **Escritorio:** barra lateral fija con: Resumen, Ingresos, Egresos, Metas, Inversiones, Ahorro y Perfil.
- **Móvil:** barra inferior con las cuatro más usadas (Resumen, Ingresos, Egresos, Metas) y un menú "Más" para Inversiones, Ahorro y Perfil.
- **Rutas privadas:** si no hay sesión, se redirige a login.

## 8. Wireframes

Son esquemas de estructura y jerarquía, no de estilo final. Los campos exactos de cada formulario se confirman contra el backend en los issues #7 y #8.

### 8.1 Login y registro

```
┌──────────────────────────────────────┐
│            MoneyWise                 │
│                                      │
│   Entra a tu cuenta                  │
│                                      │
│   Correo electrónico                 │
│   [______________________________]   │
│   Contraseña                         │
│   [______________________________]   │
│   ¿Olvidaste tu contraseña?          │
│                                      │
│   [        Iniciar sesión       ]    │
│                                      │
│   ¿Aún no tienes cuenta? Crear cuenta│
└──────────────────────────────────────┘
```

- Una sola columna centrada, sin distracciones.
- El registro es la misma estructura con: nombre, apellido paterno, apellido materno, correo, fecha de nacimiento y contraseña.
- Errores bajo cada campo y un aviso general arriba si falla el servidor.

### 8.2 Dashboard (¿cómo voy?)

```
┌───────────┬──────────────────────────────────────────────┐
│ Resumen   │  Balance del mes                             │
│ Ingresos  │  $12,480.00 MXN                              │
│ Egresos   │  desde el corte del 1 de septiembre          │
│ Metas     │                                              │
│ Inversión │  ┌─────────────┐  ┌─────────────┐            │
│ Ahorro    │  │ ↑ Ingresos  │  │ ↓ Egresos   │            │
│ Perfil    │  │ $20,000.00  │  │ $7,520.00   │            │
│           │  └─────────────┘  └─────────────┘            │
│           │                                              │
│           │  Gasto por categoría     Metas vs. ahorro    │
│           │  ┌──────────────────┐  ┌──────────────────┐  │
│           │  │  (barras)        │  │  (barras)        │  │
│           │  └──────────────────┘  └──────────────────┘  │
│           │                                              │
│           │  Movimientos recientes                       │
│           │  + Sueldo           1 sep      +$20,000.00   │
│           │  − Renta            2 sep       −$6,500.00   │
│           │  − Súper            4 sep       −$1,020.00   │
│           │                       [ Ver todos ]          │
└───────────┴──────────────────────────────────────────────┘
```

- **El balance es lo más grande.** Ingresos y egresos son apoyo, con signo y flecha.
- Si no hay fecha de corte registrada: en lugar del balance se muestra "Registra tu fecha de corte para ver tu balance" con un botón hacia Ahorro (issue #9).
- Cada gráfica lleva una tabla o resumen en texto equivalente, para lectores de pantalla.

### 8.3 Ingresos y egresos (misma estructura)

```
┌───────────┬──────────────────────────────────────────────┐
│ (nav)     │  Ingresos                [ Registrar ingreso ]│
│           │                                              │
│           │  Tipo [Todos ▾]   Periodo [Este mes ▾]       │
│           │  ┌────────────────────────────────────────┐  │
│           │  │ Fecha     Descripción   Tipo     Monto │  │
│           │  │ 1 sep     Sueldo        Nómina +$20,000│  │
│           │  │ 15 sep    Freelance     Extra   +$3,200│  │
│           │  │                         [Editar][Elim.]│  │
│           │  └────────────────────────────────────────┘  │
│           │  ‹ Anterior   Página 1 de 3   Siguiente ›    │
└───────────┴──────────────────────────────────────────────┘
```

- Formulario de alta y edición en un diálogo, con campos alimentados por los catálogos del backend (destinos, frecuencias, procedencias, tipos de ingreso o de egreso).
- Eliminar siempre pide confirmación con la consecuencia.
- Egresos reutiliza los mismos componentes que ingresos; cambia el signo (`−`), el color semántico y el filtro por tipo de egreso.
- En móvil, la tabla pasa a una lista de tarjetas.

### 8.4 Metas de ahorro

```
┌───────────┬──────────────────────────────────────────────┐
│ (nav)     │  Metas                      [ Crear meta ]   │
│           │                                              │
│           │  ┌────────────────────────────────────────┐  │
│           │  │ ◎ Viaje a Oaxaca                       │  │
│           │  │ ████████████░░░░░░░░  60 %             │  │
│           │  │ $6,000.00 de $10,000.00 MXN            │  │
│           │  │                         [Editar][Elim.]│  │
│           │  └────────────────────────────────────────┘  │
│           │  ┌────────────────────────────────────────┐  │
│           │  │ ◎ Fondo de emergencia      25 %        │  │
│           │  └────────────────────────────────────────┘  │
└───────────┴──────────────────────────────────────────────┘
```

- El progreso se dice con **barra y porcentaje en texto**, no solo con la barra.
- Una meta cumplida cambia su ícono y su texto ("Meta cumplida"), no solo el color.

### 8.5 Inversiones

```
┌───────────┬──────────────────────────────────────────────┐
│ (nav)     │  Inversiones         [ Registrar inversión ] │
│           │                                              │
│           │  Nombre / Instrumento   Monto      Fecha     │
│           │  CETES 28 días          $5,000.00  3 sep     │
│           │                         [Editar] [Eliminar]  │
└───────────┴──────────────────────────────────────────────┘
```

- Lista, alta, edición y baja con los tres estados. Los campos exactos se definen en el issue #12.

### 8.6 Perfil

```
┌───────────┬──────────────────────────────────────────────┐
│ (nav)     │  Tu perfil                                   │
│           │                                              │
│           │  Nombre            [__________________]      │
│           │  Apellido paterno  [__________________]      │
│           │  Apellido materno  [__________________]      │
│           │  Fecha de nacimiento [__/__/____]            │
│           │  Correo (no editable) correo@ejemplo.com     │
│           │                    [ Guardar cambios ]       │
│           │  ──────────────────────────────────────────  │
│           │  Seguridad                                   │
│           │  [ Cambiar contraseña ]                      │
│           │  [ Cerrar sesión ]                           │
└───────────┴──────────────────────────────────────────────┘
```

- "Olvidé mi contraseña" vive en el login y lleva a un flujo de dos pasos: pedir el enlace y restablecer.

### 8.7 Fechas de corte de ahorro

```
┌───────────┬──────────────────────────────────────────────┐
│ (nav)     │  Fecha de corte                              │
│           │  Es el día desde el que se calcula tu        │
│           │  balance. Sin ella no podemos mostrarlo.     │
│           │                                              │
│           │  [ Registrar fecha de corte ]                │
│           │  1 de septiembre de 2026         [Eliminar]  │
└───────────┴──────────────────────────────────────────────┘
```

## 9. Decisiones descartadas

- **Cobalt:** más técnica y precisa, pero fría para una app de uso diario.
- **Hum:** demasiado informal para un portafolio profesional.
- **Marca verde:** se confundiría con el semántico de ingreso.
- **Fuente de montos en mono:** se descartó a favor de Geist con cifras tabulares, que alinea igual y mantiene una sola familia.
- **`tokens.css` aparte:** `globals.css` ya es la fuente de tokens; duplicarlos solo genera desincronización.
