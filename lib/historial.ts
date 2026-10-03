import { ordenarSesiones } from "@/lib/datos";
import type { Sesion, Tanda } from "@/lib/tipos";

// Historial por ejercicio: busca el último uso de un ejercicio por su nombre
// para mostrarlo como referencia al registrar ("Última vez: 10×60 kg …").

/** Último uso encontrado de un ejercicio: fecha y sus tandas. */
export interface UsoPrevio {
  fecha: string;
  tandas: Tanda[];
}

/** Normaliza un nombre para comparar (" Press " coincide con "press"). */
export function normalizarNombre(nombre: string): string {
  return nombre.trim().toLowerCase();
}

/**
 * Devuelve el uso más reciente del ejercicio, o null si nunca se registró.
 * `excluirId` sirve para que, al editar una sesión, se muestre su uso
 * anterior y no ella misma.
 */
export function ultimoUso(
  sesiones: Sesion[],
  nombre: string,
  excluirId?: string | null
): UsoPrevio | null {
  const buscado = normalizarNombre(nombre);
  if (!buscado) return null;
  for (const sesion of ordenarSesiones(sesiones)) {
    if (excluirId && sesion.id === excluirId) continue;
    const ejercicio = sesion.ejercicios.find(
      (e) => normalizarNombre(e.nombre) === buscado
    );
    if (ejercicio && Array.isArray(ejercicio.tandas) && ejercicio.tandas.length > 0) {
      return { fecha: sesion.fecha, tandas: ejercicio.tandas };
    }
  }
  return null;
}

/** Resume unas tandas en texto corto, por ejemplo "10×60 kg · 8×55 kg". */
export function formatearTandas(tandas: Tanda[]): string {
  return tandas
    .map((t) => `${t.reps || "—"}×${t.peso ? `${t.peso} kg` : "—"}`)
    .join(" · ");
}
