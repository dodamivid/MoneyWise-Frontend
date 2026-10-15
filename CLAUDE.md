# CLAUDE.md — MoneyWise Frontend

## Proyecto

Front de MoneyWise para el portafolio de David. Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui (Base UI, preset Nova). Consume el backend `dodamivid/MoneyWise-Integracion` (Railway) a través de route handlers de Next.js: la `x-api-key` nunca llega al navegador. Cache Components y React Compiler están desactivados.

## Cómo trabajar (obligatorio)

1. Antes de tocar nada, lee el issue y explica el plan: qué vas a hacer, por qué y qué archivos tocarás. Espera el OK de David.
2. Trabaja en rama `feature/<slug>` desde `main` actualizado, nunca en `main`.
3. Antes de escribir código, explica qué hace cada pieza y por qué. Pide autorización antes de crear archivos o generar código. Avanza en pasos chicos.
4. Después de cada cambio, explica en español lo importante del código: qué hace, por qué así y qué alternativas descartaste. David quiere entender, no solo recibir código.
5. Indica siempre la ruta exacta de cada archivo.
6. Antes de dar algo por terminado, corre `npm run lint`, `npm run format:check` y `npm run build`.
7. Al terminar: resumen corto con qué se hizo, archivos tocados, qué aprender, cómo probarlo y el siguiente paso.
8. David hace sus propios commits, push y PR. Propón el mensaje de commit y la descripción del PR (con `Closes #N`). Los commits y PRs NO llevan líneas de atribución (sin Co-Authored-By, sin Claude-Session, sin "Generated with Claude Code").
9. Al empezar un issue, revisa que los skills de su fase (sección "Skills por fase") estén instalados. Si falta alguno, avisa antes de seguir.

## Convenciones

- Interfaz en español. Código en inglés, salvo los nombres del dominio que vienen de la API (ingresos, egresos, metas...).
- Código en `src/`, imports con el alias `@/*`.
- Estilos con Tailwind y los tokens de `globals.css`. Sin colores escritos a mano.
- Los componentes de shadcn viven en `src/components/ui`: no los edites sin avisar.
- Toda pantalla maneja los tres estados: cargando, vacío y error.
- Textos: botones con verbo ("Guardar cambios"), errores que digan qué pasó y cómo resolverlo.
- Formato de dinero en MXN y fechas en hora local (el backend manda ISO con `Z`).

## Seguridad

- Nunca pongas la `API_KEY` ni secretos en código, commits ni variables `NEXT_PUBLIC_`. Solo en `.env.local` (ignorado por Git).
- No corras `npm audit fix --force`. Riesgo aceptado: 7 avisos "high" por `braces`, vienen de la CLI de shadcn y no van en la app.
- No instales paquetes nuevos sin explicar para qué y pedir OK.

## Backend

- Docs: `README_API.md` y `docs/api/openapi.yaml` en el repo del backend.
- Los formatos de respuesta no son uniformes entre módulos: verifica cada endpoint.
- La autenticación del backend es simulada (`x-mw-user` y `x-mw-scopes`): confirma cómo funciona antes de construir la sesión.
- La base es de prueba (seeds) y está en Railway: evita cargas masivas.

## Entorno

Windows, Node 24 con nvm-windows, terminal cmd en VS Code (usa comandos de cmd).

## Skills por fase

- #2 (diseño): Hallmark para la identidad visual, `design-systems` para los tokens, `ux-writing` para los textos.
- Pantallas (#5–#13): `frontend-design`; revisar con Hallmark `audit` al terminar cada pantalla.
- #14 (pulido): `accessibility-audit` y, si está instalado, Impeccable (sin hooks).
- #16 (documentación): Diagram Design para el diagrama de arquitectura.
- Usa un solo skill de diseño como guía principal por tarea y no mezcles estilos.

## Issues

Se trabajan en orden #1 a #16 en GitHub.
