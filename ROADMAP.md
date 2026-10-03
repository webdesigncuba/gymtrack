# ROADMAP — GymTrack
Hoja de ruta por fases. Al completar un item, márcalo con `[x]` y fecha,
y resume el cambio en `MEMORY.md`. Orden recomendado: respaldo con plantillas → esquema+auth → migración local → sincronización.

## Fase 1 — Pulido (esfuerzo bajo)
- [x] PWA instalable (2026-10-01): manifiesto + iconos generados, `standalone`, entra en `/diario`. Sin service worker (seguimiento opcional).
- [x] Exportar/importar JSON (2026-10-01): descargar y restaurar sesiones (respaldo del `localStorage`).
- [x] `next/link` (2026-10-01): navegación instantánea sin recarga entre portada y diario.

## Fase 2 — Entrenar mejor (valor en cada sesión)
- [x] Plantillas de rutina (2026-10-01): creadas por el usuario (desde el formulario o desde cero), con usar/guardar/borrar desde el formulario.
- [-] Duplicar sesión anterior (descartado 2026-10-01): solapado con plantillas ("Guardar como plantilla" + "Usar" ya cubre repetir un día).
- [x] Historial por ejercicio (2026-10-01): último peso al escribir el nombre (coincidencia normalizada, se excluye la sesión en edición).

## Fase 3 — Motivación (más allá de la racha)
- [x] Estadísticas simples (2026-10-01): volumen total, tandas/semana (8 barras) y mejor racha histórica.
- [x] Calendario de calor (2026-10-01): cuadrícula mensual navegable, días entrenados en ámbar, hoy con borde.
- [x] Récords personales (2026-10-01): mejor peso por ejercicio con insignia "PR 🏆" en la última sesión que lo logró + bloque en estadísticas.

## Fase 4 — Técnica (cuando pique algo)
- [x] Abstracción de almacenamiento (2026-10-01): interfaz `Almacen` en `lib/almacen.ts`; migrar a DB solo si hay sincronización multi-dispositivo.
- [x] Tests de `lib/` con vitest (2026-10-01): 43 tests de todo `lib/`, sin jsdom.
- [x] Migrar clases viejas a utilidades Tailwind (2026-10-01): base `@theme` + los 7 componentes/páginas; en `globals.css` solo quedan base, animaciones y `[hidden]`.

## Fase 5 - Multi usuarios
Cada cuenta ve solo sus sesiones (nada compartido entre móviles).
Criterio de "listo": dos cuentas distintas ven cada una solo lo suyo.
- [x] Respaldo con plantillas (2026-10-01): un solo JSON `{ version: 1, sesiones, plantillas }`, restauración por clave y array antiguo compatible.
- [x] Esquema + autenticación en Supabase (2026-10-01): tablas `sesiones` y `plantillas` con `user_id` y RLS; nube si logueado, local si no. Sincronización de plantillas y offline con cuenta, pendientes..
- [x] Crear Pantallas de Login y Registro de Usuarios.

## Fase 6 - Sección Dieta
Cada cuenta ve solo sus dietas y sus estadísticas (nada compartido entre móviles).
Criterio de "listo": dos cuentas distintas ven cada una solo lo suyo + al escribir
nombre ("pan") + gramos calcula solo kcal, carbohidratos, grasas y proteínas + totales del día cuadran.
- [x] Base local de alimentos por 100g + cálculo por gramos (2026-10-03): 20 alimentos con alias ("pao"/"pão" → pan), búsqueda normalizada y fallback manual.
- [x] Registro de comidas por día (2026-10-03): pestaña "Dieta" con formulario (nombre + gramos → cálculo solo) y lista del día con totales y eliminar.
- [x] Tabla `comidas` con `user_id` + RLS por cuenta + respaldo v2 compatible (2026-10-03): local `gymtrack_comidas` + nube con espejo; la v1 se lee sin tocar la dieta.
- [x] Resumen y progreso 7 días (2026-10-03): promedio kcal/día, kcal hoy, días con registro + barras diarias.

## Fase 7 - Perfil del usuario
Cada cuenta ve solo sus datos (nada compartido entre móviles).
Criterio de "listo": dos cuentas distintas ven cada una solo lo suyo; con el perfil completo se muestra lo necesario y lo comido hoy se compara con ello.
- [x] Sección Perfil (2026-10-03): pestaña "Perfil" con edad, estatura (cm) y peso (kg), validación por rangos, guardado por cuenta (local `gymtrack_perfil` + tabla `perfiles` con RLS) y respaldo v3 compatible.
- [x] Calorías necesarias (2026-10-03): sexo + actividad + objetivo en el perfil, cálculo Mifflin-St Jeor (`lib/nutricion.ts`), vista en Perfil y comparativa hoy/objetivo en Dieta. Columnas nuevas en `perfiles` (compatibles con lo ya guardado).
- [x] Héroe visual de dieta (2026-10-03): anillo de progreso + kcal consumidas/objetivo en grande + desglose C/P/G del día arriba de la pestaña Dieta, con aviso y CTA al perfil si faltan datos.

## Versión 1 — Cerrada en 1.13.0 (2026-10-03)
La v1 queda congelada: solo parches `1.13.x` por seguridad o bug crítico
(datos ajenos visibles, pérdida de datos o login roto). Nada de mejoras ni UI nueva.
Pasada de seguridad del cierre: RLS "todo lo propio" en las 4 tablas, sin
`service_role` en cliente (solo anónima), caché borrada al salir, sin XSS
(sin `dangerouslySetInnerHTML`/`eval`), `npm audit` con 0 vulnerabilidades,
`.env*.local` ignorado y `.env.example` sin secretos.
- [x] Parche 1.13.1 (2026-10-03): al crear cuenta sin sesión (email por confirmar) se avisa "revisa tu email" en vez de entrar directo.

## Versión 2 — Pendiente de testeo
Las propuestas que salgan del testeo se aparcan aquí (sin tocar código hasta
abrir la v2 en `2.0.0`).
- [ ] (hueco para la primera propuesta del testeo)

