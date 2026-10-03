import type { Sesion } from "@/lib/tipos";

// Guardado de datos en localStorage.
// El navegador bloquea el acceso a localStorage durante el renderizado del
// servidor, por eso solo lo usamos dentro de useEffect (lado cliente).

const CLAVE = "gymtrack_sesiones";

/** Comprueba que un dato leído tiene forma de sesión válida.
 * Se reutiliza para validar respaldos importados. */
export function esSesion(dato: unknown): dato is Sesion {
  if (typeof dato !== "object" || dato === null) return false;
  const s = dato as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    typeof s.fecha === "string" &&
    typeof s.creadaEn === "number" &&
    Array.isArray(s.ejercicios)
  );
}

/** Carga las sesiones guardadas. Devuelve un array (vacío si no hay nada). */
export function cargarSesiones(): Sesion[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = window.localStorage.getItem(CLAVE);
    if (!bruto) return [];
    const datos: unknown = JSON.parse(bruto);
    return Array.isArray(datos) ? datos.filter(esSesion) : [];
  } catch (error) {
    console.warn("No se pudieron leer las sesiones guardadas:", error);
    return [];
  }
}

/** Guarda la lista completa de sesiones. */
export function guardarSesiones(sesiones: Sesion[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(sesiones));
  } catch (error) {
    console.warn("No se pudieron guardar las sesiones:", error);
  }
}

/** Borra las sesiones guardadas en este navegador. */
export function olvidarSesiones(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CLAVE);
  } catch (error) {
    console.warn("No se pudieron borrar las sesiones:", error);
  }
}

/** Ordena las sesiones de la más reciente a la más antigua. */
export function ordenarSesiones(sesiones: Sesion[]): Sesion[] {
  return [...sesiones].sort((a, b) => {
    if (a.fecha === b.fecha) return (b.creadaEn ?? 0) - (a.creadaEn ?? 0);
    return a.fecha < b.fecha ? 1 : -1;
  });
}
