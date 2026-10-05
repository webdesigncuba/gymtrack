# AGENTS.md — gymtrack

Next.js 16 + React 19 + TypeScript estricto + Tailwind v4 + Supabase (opcional, solo con `.env.local`). Sin tests, lint ni CI.

## Comandos

- `npm install` — instalar dependencias
- `npm run dev` — desarrollo (http://localhost:3000)
- `npm run build` — verificación principal (compila con Turbopack); debe pasar antes de dar por hecha una tarea
- `npm test` — tests de `lib/` con vitest (94 tests: fechas, datos, estadísticas, historial, calendario, plantillas, respaldo, almacén, nube, dieta, perfil y nutrición)
- `npx tsc --noEmit` — verificación de tipos (cero errores, sin `any` innecesarios)
- `npm start` — sirve el build de producción

## Estructura

- `app/layout.tsx` — layout raíz (`lang="es"`, metadata, `viewport` con themeColor, importa `globals.css`, carga Oswald con `next/font/google` como `--font-display` solo para numerales)
- `app/page.tsx` — bienvenida a pantalla completa (portada: hero CSS/SVG + CTA al diario)
- `app/diario/page.tsx` — diario (`"use client"`; pestañas Registrar/Sesiones/Dieta/Perfil/Progreso/Respaldo + estado de sesiones, comidas y perfil)
- `app/globals.css` — Tailwind (`@import "tailwindcss"`) + tokens en `@theme`; solo quedan base, animaciones y `[hidden]`
- `app/manifest.ts` — manifiesto PWA (standalone, `start_url: /diario`); `app/icon.tsx` + `app/apple-icon.tsx` — iconos PNG generados en el build con `ImageResponse`
- `lib/tipos.ts` — tipos del dominio (`Sesion`, `Ejercicio`, `Tanda`, `Alimento`, `Comida`, `Perfil`); el único lugar donde se definen
- `lib/estilos.ts` — clases Tailwind compartidas (tarjeta, botones, campos); los componentes no repiten cadenas largas
- `lib/almacen.ts` — interfaz `Almacen` async (`cargar`/`guardar`); `almacenLocal` usa `localStorage`, `almacenNube` (en `lib/almacenNube.ts`) usa Supabase; `limpiarCacheLocal` borra sesiones, plantillas, comidas y perfil
- `lib/supabaseCliente.ts` — cliente de navegador (solo clave anónima) + `haySupabase()`; `supabase/schema.sql` — tablas + RLS para pegar en el dashboard
- `lib/plantillas.ts` — plantillas del usuario (`Plantilla` + guard `esPlantilla`); clave propia `gymtrack_plantillas`
- `lib/alimentos.ts` — base de alimentos por 100 g + comidas (`esComida`, `crearComida`, `totalesDelDia`, `kcalPorDia`); clave propia `gymtrack_comidas`
- `lib/perfil.ts` — datos del usuario (`Perfil` + guard `esPerfil` + `LIMITES_PERFIL`); clave propia `gymtrack_perfil`
- `lib/nutricion.ts` — calorías necesarias (Mifflin-St Jeor + actividad + objetivo; `caloriasNecesarias`)
- `lib/historial.ts` — último uso por ejercicio (`ultimoUso`, `formatearTandas`); coincidencia por nombre normalizado
- `lib/calendario.ts` — semanas del mes desde el lunes (`diasDelMes`, `moverMes`); intensidad binaria (una sesión/día)
- `lib/estadisticas.ts` — volumen, tandas por semana y mejor racha histórica (semanas locales lunes-domingo)
- `tsconfig.json` (estricto, alias `@/*`) y `postcss.config.mjs` (Tailwind v4)
- `ROADMAP.md` — hoja de ruta por fases; al completar un item se marca `[x]` con fecha
- `components/FormularioSesion.tsx` — formulario de sesión (fecha + filas de ejercicios); modo registro o edición según `sesionEnEdicion`
- `components/ListaSesiones.tsx` — lista ordenada reciente → antigua (recibe sesiones ya ordenadas) con botones Editar / Eliminar
- `components/CronometroDescanso.tsx` — cronómetro de descanso (60/90/120 s + personalizado); arranca solo con `senalInicio`, al activarse se abre como modal bloqueante (sin cerrar hasta "Entendido")
- `components/Estadisticas.tsx` — tarjeta tras la racha (3 cifras + barras de 8 semanas; oculta sin sesiones)
- `components/Respaldo.tsx` — respaldo versionado `{ version: 3, sesiones, plantillas, comidas, perfil }` con restauración por clave (+ `lib/respaldo.ts`)
- `components/Perfil.tsx` — datos del usuario (edad, estatura, peso, sexo, actividad, objetivo) con vista en vivo de las kcal necesarias
- `components/FormularioDieta.tsx` + `components/ListaComidas.tsx` + `components/ProgresoDieta.tsx` — dieta: registro por gramos, lista del día y progreso de 7 días
- `components/BalanceCalorico.tsx` — héroe de dieta: anillo CSS con % del objetivo, kcal consumidas/objetivo en grande (`font-display`) y desglose C/P/G; sin objetivo muestra CTA al perfil
- `components/Auth.tsx` — cuenta con email+contraseña (sin Supabase configurado avisa y todo sigue en local); con "¿Olvidaste tu contraseña?" envía el enlace de recuperación (`resetPasswordForEmail` → `/actualizar-clave`)
- `app/actualizar-clave/page.tsx` — pone la clave nueva tras el enlace del email (espera la sesión `PASSWORD_RECOVERY` y llama a `updateUser`)
- `lib/fechas.ts` — fechas y racha (+ `fechas.test.ts`); `lib/datos.ts` — localStorage y ordenación (+ `datos.test.ts`)
- Alias `@/*` → raíz del proyecto (`tsconfig.json`)

## Reglas que no debes romper

- **Fechas siempre locales, nunca UTC.** No uses `toISOString`, `getUTC*` ni `Date.parse` sobre `YYYY-MM-DD` (se interpreta como UTC). Patrón correcto: `new Date(anio, mes - 1, dia)` + `getFullYear/getMonth/getDate`. Fechas como string `YYYY-MM-DD` (`hoyISO`, `aISO`, `moverDias` en `lib/fechas.ts`).
- **Racha (`calcularRacha`):** un día cuenta con ≥1 sesión; cuenta días consecutivos hacia atrás desde hoy; si hoy no hay sesión pero ayer sí, la racha sigue viva (0 solo si no hay ni hoy ni ayer).
- **localStorage:** claves `gymtrack_sesiones`, `gymtrack_plantillas`, `gymtrack_comidas` y `gymtrack_perfil` como caché del login (se borra al salir). Toda la persistencia pasa por la interfaz `Almacen` async (`lib/almacen.ts`) o los backends inyectados (`BackendPlantillas`, `BackendComidas`, `BackendPerfil`). Solo acceso en cliente (`typeof window === "undefined"` → devolver `[]`/`null` / no-op); en `app/diario/page.tsx` leer en `useEffect` de montaje y guardar en `useEffect` con flag `cargando` para no sobrescribir antes de cargar.
- **Supabase (opcional):** tablas `sesiones`, `plantillas`, `comidas` y `perfiles` con `user_id` + RLS (`auth.uid() = user_id`); regla "una sesión por usuario y día", varias comidas por día y un perfil por cuenta. Login obligatorio para ver el diario (sin configurar, `Auth` explica cómo); el respaldo incluye el email del dueño (informativo). Logueado = nube + espejo local, salir borra la caché; plantillas, comidas y perfil por backend inyectado. Clave anónima pública OK en cliente; `service_role` prohibida en cliente. Sin `.env.local` solo se ve el aviso de cuenta. La recuperación de clave exige `/actualizar-clave` en Redirect URLs del dashboard.
- **UI en español**, código y comentarios simples para principiantes (utilidades Tailwind con tokens propios en `@theme`; `globals.css` solo guarda base, animaciones y `[hidden]`). Navegación interna con `next/link` (el `<a>` programático de descarga en `Respaldo.tsx` es la excepción). Tipos del dominio solo en `lib/tipos.ts` (sin `any` innecesarios). El respaldo reutiliza el guard `esSesion` y la restauración reemplaza todo con confirmación. Las plantillas las crea el usuario de dos formas (desde el formulario o desde cero en la misma sección, plegada con `<details>` y cerrada por defecto) y aplicarlas reemplaza el formulario con `confirm` si ya hay contenido. El historial muestra el último uso por nombre normalizado (editando se excluye la propia sesión). Récord = peso máximo por nombre normalizado; la insignia `PR 🏆` marca solo la última sesión que lo logró. Única fuente externa: Oswald (`next/font/google`, autohospedada en el build, sin dependencias nuevas) solo para los numerales de marcador (utilidad `font-display` en racha y cronómetro); el resto usa la pila del sistema.
- **Modelo de datos sesión:** `{ id, fecha: "YYYY-MM-DD", creadaEn: timestamp, ejercicios: [{ nombre, tandas: [{ reps, peso }] }] }`. Solo una sesión por día (el formulario rechaza fechas ya usadas y `guardarSesion` lo refuerza). Edición: `app/diario/page.tsx` guarda `idEnEdicion`; el formulario precarga la sesión, conserva su `id`/`creadaEn` al guardar y permite mantener su propia fecha; la lista marca la sesión con "Editando…". Validación: cada ejercicio con nombre exige ≥1 tanda con `reps` (vacío o 0 no cuenta); el peso acepta vacío (peso corporal). Los fallos muestran error inline + toast flotante (utilidades + `anim-toast`, se auto-oculta a los 3,5 s). El código viejo (`tandas: "3"`, `repeticiones`, `peso`) se migra al leer.
- **Modelo de datos perfil:** `{ edadAnos, estaturaCm, pesoKg, sexo, actividad, objetivo }` (números o `null`; vacíos permitidos). Rangos: edad 5–120, estatura 50–250 cm, peso 20–400 kg (`LIMITES_PERFIL` en `lib/perfil.ts`). Un perfil por cuenta. Las calorías se calculan en `lib/nutricion.ts` (Mifflin-St Jeor + factor de actividad + ajuste: mantener 0, perder −400, ganar +250; orientativo, no consejo médico) y solo se muestran con el perfil completo. Los perfiles antiguos sin sexo/actividad se aceptan y se normalizan a `null`. Los fallos muestran error inline + toast como el resto de formularios.
- **Cronómetro:** estado efímero, no se persiste en localStorage. Cuenta atrás con `setInterval` + `Date.now()` (sin deriva); aviso con WebAudio + `navigator.vibrate` en `try/catch`. En reposo muestra la tarjeta para elegir duración; al activarse se abre como modal centrado bloqueante (utilidades + `anim-modal`, scroll del `body` bloqueado, `role="dialog"` + `aria-modal`) que no deja trabajar en el sistema: sin cambiar duración ni cerrar, solo pausar/reanudar y, al terminar, "Entendido". `app/diario/page.tsx` lo dispara con `senalDescanso` cada vez que el formulario añade una tanda.

## Forma de trabajar
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- La versión vive en 3 sitios y siempre iguales: `MEMORY.md`, `package.json` y `lib/version.ts` (visible en la portada). Al subir versión, actualiza los tres.
- Cada funcionalidad implementada sube la versión (minor: 1.x → 1.x+1); las mejoras técnicas o reorganizaciones, no.
- v1 cerrada en 1.13.0: solo parches 1.13.x por seguridad o bug crítico (datos ajenos visibles, pérdida de datos o login roto). Lo demás va a la v2 (empieza en 2.0.0).
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.

## Límites
- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build. sin autorizacion

## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su
porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales). 
