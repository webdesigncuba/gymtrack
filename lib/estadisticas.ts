import { hoyISO, moverDias } from "@/lib/fechas";
import type { Sesion } from "@/lib/tipos";

// Estadísticas simples calculadas de las sesiones guardadas.
// Todo con fecha local; el peso corporal (vacío) suma 0 al volumen.

/** Suma de reps × peso de cada tanda con ambos datos numéricos. */
export function volumenTotal(sesiones: Sesion[]): number {
  let total = 0;
  for (const sesion of sesiones) {
    for (const ejercicio of sesion.ejercicios) {
      // Las sesiones muy antiguas pueden traer otro formato: se ignoran.
      if (!Array.isArray(ejercicio.tandas)) continue;
      for (const tanda of ejercicio.tandas) {
        const reps = parseFloat(tanda.reps);
        const peso = parseFloat(tanda.peso);
        if (Number.isFinite(reps) && Number.isFinite(peso)) total += reps * peso;
      }
    }
  }
  // Evita polvo de coma flotante (p. ej. 0.1 + 0.2).
  return Math.round(total * 100) / 100;
}

/** Una semana con su etiqueta corta y su nº de tandas. */
export interface Semana {
  clave: string;
  etiqueta: string;
  tandas: number;
}

/** Devuelve el lunes (YYYY-MM-DD) de la semana de una fecha local. */
function lunesDe(iso: string): string {
  const [anio, mes, dia] = iso.split("-").map(Number);
  const diaSemana = new Date(anio, mes - 1, dia).getDay(); // 0 = domingo
  return moverDias(iso, -((diaSemana + 6) % 7));
}

/** Etiqueta corta de una fecha, por ejemplo "12 ene". */
function etiquetaCorta(iso: string): string {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(
    new Date(anio, mes - 1, dia)
  );
}

/**
 * Tandas por semana (de lunes a domingo) de las últimas `cuantas` semanas,
 * terminando en la actual aunque esté a medias.
 */
export function tandasPorSemana(sesiones: Sesion[], cuantas = 8): Semana[] {
  const porClave = new Map<string, number>();
  for (const sesion of sesiones) {
    let tandas = 0;
    for (const ejercicio of sesion.ejercicios) {
      if (Array.isArray(ejercicio.tandas)) tandas += ejercicio.tandas.length;
    }
    const clave = lunesDe(sesion.fecha);
    porClave.set(clave, (porClave.get(clave) ?? 0) + tandas);
  }
  const lunesActual = lunesDe(hoyISO());
  return Array.from({ length: cuantas }, (_, i) => {
    const clave = moverDias(lunesActual, -(cuantas - 1 - i) * 7);
    return { clave, etiqueta: etiquetaCorta(clave), tandas: porClave.get(clave) ?? 0 };
  });
}

/**
 * Mejor racha de días consecutivos con sesión en todo el historial
 * (distinto de la racha viva, que solo mira hasta hoy).
 */
export function mejorRacha(fechas: string[]): number {
  // En formato YYYY-MM-DD el orden alfabético es el cronológico.
  const dias = [...new Set(fechas)].sort();
  let mejor = 0;
  let actual = 0;
  let previo: string | null = null;
  for (const dia of dias) {
    actual = previo !== null && moverDias(previo, 1) === dia ? actual + 1 : 1;
    mejor = Math.max(mejor, actual);
    previo = dia;
  }
  return mejor;
}

/** Récord de un ejercicio: mejor peso, fecha en que se logró y su nombre. */
export interface RecordEjercicio {
  nombre: string;
  peso: number;
  fecha: string;
}

/**
 * Mejor peso por ejercicio en todo el historial (nombres comparados sin
 * distinguir mayúsculas ni espacios). En empates gana la fecha más reciente
 * y el nombre conserva su escritura más reciente.
 */
export function recordsPorEjercicio(sesiones: Sesion[]): RecordEjercicio[] {
  const porNombre = new Map<string, RecordEjercicio>();
  // Recorremos de antiguo a moderno para que el empate lo gane lo último.
  const ordenadas = [...sesiones].sort((a, b) =>
    a.fecha === b.fecha ? a.creadaEn - b.creadaEn : a.fecha < b.fecha ? -1 : 1
  );
  for (const sesion of ordenadas) {
    for (const ejercicio of sesion.ejercicios) {
      if (!Array.isArray(ejercicio.tandas)) continue;
      const clave = ejercicio.nombre.trim().toLowerCase();
      if (!clave) continue;
      for (const tanda of ejercicio.tandas) {
        const peso = parseFloat(tanda.peso);
        if (!Number.isFinite(peso)) continue;
        const actual = porNombre.get(clave);
        if (!actual || peso >= actual.peso) {
          porNombre.set(clave, {
            nombre: ejercicio.nombre.trim(),
            peso,
            fecha: sesion.fecha,
          });
        }
      }
    }
  }
  // De mayor a menor peso: lo más motivador primero.
  return [...porNombre.values()].sort((a, b) => b.peso - a.peso);
}
