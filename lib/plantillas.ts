// Plantillas de rutina creadas por el usuario.
// Una plantilla guarda ESTRUCTURA (nombres + nº de tandas), no valores:
// los pesos y reps se rellenan cada día al entrenar.
// Viven en su propia clave para que el respaldo de sesiones no las toque.

const CLAVE = "gymtrack_plantillas";

/** Un ejercicio dentro de una plantilla: nombre y cuántas tandas. */
export interface PlantillaEjercicio {
  nombre: string;
  tandas: number;
}

/** Una plantilla de rutina con nombre y lista de ejercicios. */
export interface Plantilla {
  id: string;
  nombre: string;
  creadaEn: number;
  ejercicios: PlantillaEjercicio[];
}

/** Comprueba que un dato leído tiene forma de plantilla válida. */
export function esPlantilla(dato: unknown): dato is Plantilla {
  if (typeof dato !== "object" || dato === null) return false;
  const p = dato as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.nombre === "string" &&
    typeof p.creadaEn === "number" &&
    Array.isArray(p.ejercicios) &&
    p.ejercicios.every((e) => {
      if (typeof e !== "object" || e === null) return false;
      const ej = e as Record<string, unknown>;
      return typeof ej.nombre === "string" && typeof ej.tandas === "number";
    })
  );
}

/** Carga las plantillas guardadas. Devuelve un array (vacío si no hay nada). */
export function cargarPlantillas(): Plantilla[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = window.localStorage.getItem(CLAVE);
    if (!bruto) return [];
    const datos: unknown = JSON.parse(bruto);
    return Array.isArray(datos) ? datos.filter(esPlantilla) : [];
  } catch (error) {
    console.warn("No se pudieron leer las plantillas guardadas:", error);
    return [];
  }
}

/** Guarda la lista completa de plantillas. */
export function guardarPlantillas(plantillas: Plantilla[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(plantillas));
  } catch (error) {
    console.warn("No se pudieron guardar las plantillas:", error);
  }
}

/** Borra las plantillas guardadas en este navegador. */
export function olvidarPlantillas(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CLAVE);
  } catch (error) {
    console.warn("No se pudieron borrar las plantillas:", error);
  }
}

/**
 * Fuente de plantillas intercambiable (local o nube).
 * El formulario y el respaldo la reciben por props y no saben cuál usan.
 */
export interface BackendPlantillas {
  cargar: () => Promise<Plantilla[]>;
  guardar: (plantillas: Plantilla[]) => Promise<void>;
}

/** Implementación local con `localStorage`. */
export const backendLocalPlantillas: BackendPlantillas = {
  cargar: async () => cargarPlantillas(),
  guardar: async (plantillas) => {
    guardarPlantillas(plantillas);
  },
};
