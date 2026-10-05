import type { Alimento } from "@/lib/tipos";

// "Mis alimentos": lo que el usuario mete a mano (o trae de online) y quiere
// reutilizar. Viven en clave propia y entran en el respaldo v4.

const CLAVE_CUSTOM = "gymtrack_alimentos_custom";

/** Comprueba que un dato tiene forma de alimento válido (por 100 g). */
export function esAlimento(dato: unknown): dato is Alimento {
  if (typeof dato !== "object" || dato === null) return false;
  const a = dato as Record<string, unknown>;
  if (typeof a.nombre !== "string" || a.nombre.trim() === "") return false;
  for (const clave of ["kcal", "carbos", "proteinas", "grasas"] as const) {
    if (typeof a[clave] !== "number") return false;
    const valor = a[clave] as number;
    if (!Number.isFinite(valor) || valor < 0) return false;
  }
  if (a.alias !== undefined) {
    if (!Array.isArray(a.alias)) return false;
    if (!(a.alias as unknown[]).every((x) => typeof x === "string")) return false;
  }
  return true;
}

/** Carga los alimentos personalizados. Vacío si no hay nada. */
export function cargarAlimentosCustom(): Alimento[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = window.localStorage.getItem(CLAVE_CUSTOM);
    if (!bruto) return [];
    const datos: unknown = JSON.parse(bruto);
    return Array.isArray(datos) ? datos.filter(esAlimento) : [];
  } catch (error) {
    console.warn("No se pudieron leer los alimentos personalizados:", error);
    return [];
  }
}

/** Guarda la lista completa de alimentos personalizados. */
export function guardarAlimentosCustom(alimentos: Alimento[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE_CUSTOM, JSON.stringify(alimentos));
  } catch (error) {
    console.warn("No se pudieron guardar los alimentos personalizados:", error);
  }
}

/** Borra los alimentos personalizados de este navegador. */
export function olvidarAlimentosCustom(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CLAVE_CUSTOM);
  } catch (error) {
    console.warn("No se pudieron borrar los alimentos personalizados:", error);
  }
}

/**
 * Fuente de alimentos personalizados intercambiable (local o nube).
 * Igual que plantillas/comidas/perfil: con login escribe en la nube
 * y deja copia local (espejo).
 */
export interface BackendAlimentos {
  cargar: () => Promise<Alimento[]>;
  guardar: (alimentos: Alimento[]) => Promise<void>;
}

/** Implementación local con `localStorage`. */
export const backendLocalAlimentos: BackendAlimentos = {
  cargar: async () => cargarAlimentosCustom(),
  guardar: async (alimentos) => {
    guardarAlimentosCustom(alimentos);
  },
};
