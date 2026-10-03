# GymTrack 💪

Diario de gimnasio + dieta + perfil. Registra tus sesiones, cuenta tus
calorías y sigue tu racha. Funciona en el móvil (PWA) con o sin cuenta:
sin cuenta todo queda en el navegador; con cuenta se sincroniza en la nube.

**Versión 1.13.0** — v1 cerrada (solo parches `1.13.x` de seguridad).
Las propuestas nuevas van a la versión 2 (ver `ROADMAP.md`).

## Qué incluye

- **Registrar**: sesiones con ejercicios, tandas, reps y peso + cronómetro de descanso.
- **Sesiones**: historial con edición, récords personales (PR 🏆) e historial por ejercicio.
- **Dieta**: registro por gramos con cálculo solo (base local, p. ej. "pao" → pan), lista del día, héroe visual con anillo de progreso y progreso de 7 días.
- **Perfil**: edad, estatura, peso, sexo, actividad y objetivo → kcal diarias necesarias (Mifflin-St Jeor, orientativo).
- **Progreso**: racha 🔥, volumen, tandas por semana y calendario de calor.
- **Respaldo**: descarga/restaura todo en un JSON versionado.
- **Cuentas**: cada cuenta ve solo lo suyo (RLS en Supabase).

## Probarlo

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # tests de lib/ con vitest
npm run build   # verificación principal
```

### Nube opcional (Supabase)

1. Copia `.env.example` a `.env.local` y rellena con tus datos.
2. Pega `supabase/schema.sql` en el editor SQL de Supabase (Database → SQL).
3. Crea una cuenta desde la app. Sin configurar, todo sigue en local.

## Seguridad (v1)

- RLS "todo lo propio" (`auth.uid() = user_id`) en las 4 tablas.
- Solo clave anónima en el cliente; `service_role` prohibida.
- Al salir se borra la caché local. `npm audit` limpio.

## Docs del proyecto

- `AGENTS.md` — reglas del proyecto (lectura obligada antes de codificar).
- `ROADMAP.md` — hoja de ruta por fases y estado de la v1/v2.
- `MEMORY.md` — memoria breve entre sesiones.
