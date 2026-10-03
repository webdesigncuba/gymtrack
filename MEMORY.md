# MEMORY.md — Diario de seguimiento de ejercicios (gymtrack)
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.
## Estado actual
- v1.13 funcionando: portada (`/`), diario en `/diario` con login obligatorio (cada cuenta ve solo lo suyo), racha 🔥, estadísticas, cronómetro, respaldo con dueño, PWA, historial, dieta con héroe de kcal y perfil con calorías.
- TypeScript estricto (`npx tsc --noEmit` limpio) + Tailwind v4 con tokens en `@theme`; en `globals.css` solo base, animaciones y `[hidden]`.
- Solo una sesión por día (se edita sin borrar); cada ejercicio lleva sus tandas con reps + peso. Validación con error inline + toast (3,5 s).
- Datos en localStorage (clave `gymtrack_sesiones`) vía interfaz `Almacen` async.
- Cronómetro (60/90/120 s + personalizado): arranca al añadir cada tanda, modal bloqueante hasta "Entendido"; pitido + vibración.
- Dieta completa (fase 6 cerrada en v1.10): tipos `Alimento`/`Comida`, base de 20 alimentos por 100 g ("pao"/"pão" → pan, cálculo por gramos), guardado local (`gymtrack_comidas`) + nube (tabla `comidas` RLS) + respaldo v2, pestaña "Dieta" con formulario (fallback manual), lista del día con totales y progreso de 7 días.
- Perfil (fase 7 en v1.11–v1.13): `Perfil` con edad, estatura, peso, sexo, actividad y objetivo; pestaña "Perfil", tabla `perfiles` RLS (uno por cuenta) + respaldo v3. `lib/nutricion.ts` calcula lo necesario (Mifflin-St Jeor + actividad + ajuste; orientativo): vista en Perfil y héroe en Dieta (`BalanceCalorico`: anillo % + kcal en grande + C/P/G, con CTA al perfil si faltan datos). Lo antiguo sin sexo/actividad se normaliza a `null`.
## Decisiones (y por qué)
- Next.js 16 + React 19 + TypeScript estricto + Tailwind v4: código simple para
  alguien que empieza; estilos en `app/globals.css`.
- Fechas siempre locales (`YYYY-MM-DD`), nunca UTC: evita que la racha se rompa por
  desfase horario.
- Racha viva si ayer hubo sesión aunque hoy falte (no se rompe hasta terminar el día).
- Sesiones viejas (`tandas: "3"`, `repeticiones`, `peso`) se migran al leer, sin
  borrar datos del usuario.
- Cronómetro con `setInterval` + `Date.now()` (evita deriva del intervalo) y aviso
  en `try/catch` por si el navegador bloquea audio/vibración.
- Bienvenida sin foto externa: hero CSS/SVG inline para no añadir dependencias ni
  peticiones a terceros y funcionar sin conexión.
- Respaldo con reemplazo total (no fusión): predecible y simple de explicar; la
  confirmación sigue el patrón del borrado existente.
- PWA sin service worker (de momento): iconos vía `ImageResponse` para no añadir
  dependencias; el modo 100% sin conexión queda como seguimiento opcional.
- Base de datos solo vía Supabase opcional (nube si logueado, local si no);
  `service_role` prohibida en cliente.
- Diario por pestañas (Registrar/Sesiones/Dieta/Perfil/Progreso/Respaldo): los paneles se ocultan
  con `hidden`, no se desmontan, para no perder el formulario ni el cronómetro.
- Plantillas con estructura sin valores en clave propia (creables desde el
  formulario o desde cero): el respaldo de sesiones no las toca.
- Diseño oscuro solo en `app/globals.css` (caucho+acero+tiza+ámbar); numerales en
  Oswald autohospedada, solo racha y cronómetro.
- Tests con vitest sin jsdom (94 tests de todo `lib/`); los .test.ts viven junto al
  código con imports relativos (`vitest.config.ts` resuelve `@/`).
## Aprendizajes y errores a evitar
- No usar `toISOString` / `getUTC*` / `Date.parse` con `YYYY-MM-DD` (se interpreta UTC).
- localStorage solo en cliente (`typeof window` + `useEffect` con flag `cargando`).
- No usar banderas de "primer render" para ignorar efectos con señales: en modo
  estricto (dev) los efectos corren dos veces; comparar valor anterior vs actual.
- Cada vez que implementes algo por el comando /feature te dejo a tu entender subir o no la version.
## Próximos pasos
- v1 cerrada en 1.13.0 (solo parches 1.13.x de seguridad). Propuestas del testeo → versión 2 en `ROADMAP.md`.
