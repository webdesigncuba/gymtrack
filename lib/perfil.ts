import type { Actividad, Objetivo, Perfil, Sexo } from "@/lib/tipos";

// Datos del usuario (edad, estatura, peso, sexo, actividad y objetivo).
// Un solo perfil por cuenta: sirve para calcular sus calorías diarias
// (TMB con Mifflin-St Jeor + gasto según actividad + ajuste por objetivo).
// Vive en su propia clave para que el respaldo de sesiones no lo toque.

const CLAVE = "gymtrack_perfil";

/** Perfil vacío: nada rellenado. */
export const PERFIL_VACIO: Perfil = {
  edadAnos: null,
  estaturaCm: null,
  pesoKg: null,
  sexo: null,
  actividad: null,
  objetivo: null,
};

/** Rangos aceptados para cada campo (null = sin rellenar, siempre vale). */
export const LIMITES_PERFIL = {
  edadAnos: { min: 5, max: 120 },
  estaturaCm: { min: 50, max: 250 },
  pesoKg: { min: 20, max: 400 },
} as const;

/** Valores aceptados para sexo, actividad y objetivo. */
export const SEXOS: Sexo[] = ["hombre", "mujer"];
export const ACTIVIDADES: Actividad[] = [
  "sedentario",
  "ligero",
  "moderado",
  "activo",
  "muy_activo",
];
export const OBJETIVOS: Objetivo[] = ["mantener", "perder", "ganar"];

/** Comprueba que un número o null está dentro de su rango. */
function enRango(valor: unknown, min: number, max: number): valor is number | null {
  if (valor === null) return true;
  return (
    typeof valor === "number" &&
    Number.isFinite(valor) &&
    valor >= min &&
    valor <= max
  );
}

/** Comprueba que un texto es uno de los permitidos (o no rellenado). */
function esOpcion<T extends string>(valor: unknown, opciones: T[]): valor is T | null {
  // Los perfiles guardados antes de este campo no lo traen (undefined):
  // valen igual que null.
  if (valor === null || valor === undefined) return true;
  return typeof valor === "string" && opciones.includes(valor as T);
}

/** Comprueba que un dato leído tiene forma de perfil válido. */
export function esPerfil(dato: unknown): dato is Perfil {
  if (typeof dato !== "object" || dato === null) return false;
  const p = dato as Record<string, unknown>;
  return (
    enRango(p.edadAnos, LIMITES_PERFIL.edadAnos.min, LIMITES_PERFIL.edadAnos.max) &&
    enRango(p.estaturaCm, LIMITES_PERFIL.estaturaCm.min, LIMITES_PERFIL.estaturaCm.max) &&
    enRango(p.pesoKg, LIMITES_PERFIL.pesoKg.min, LIMITES_PERFIL.pesoKg.max) &&
    esOpcion(p.sexo, SEXOS) &&
    esOpcion(p.actividad, ACTIVIDADES) &&
    esOpcion(p.objetivo, OBJETIVOS)
  );
}

/**
 * Rellena con null los campos que falten (perfiles guardados antes de
 * añadir sexo/actividad/objetivo). Solo llamar con un `esPerfil` válido.
 */
export function normalizarPerfil(dato: Perfil): Perfil {
  return {
    edadAnos: dato.edadAnos ?? null,
    estaturaCm: dato.estaturaCm ?? null,
    pesoKg: dato.pesoKg ?? null,
    sexo: dato.sexo ?? null,
    actividad: dato.actividad ?? null,
    objetivo: dato.objetivo ?? null,
  };
}

/** Carga el perfil guardado. Devuelve null si no hay nada. */
export function cargarPerfil(): Perfil | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(CLAVE);
    if (!bruto) return null;
    const datos: unknown = JSON.parse(bruto);
    return esPerfil(datos) ? normalizarPerfil(datos) : null;
  } catch (error) {
    console.warn("No se pudo leer el perfil guardado:", error);
    return null;
  }
}

/** Guarda el perfil completo. */
export function guardarPerfil(perfil: Perfil): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(perfil));
  } catch (error) {
    console.warn("No se pudo guardar el perfil:", error);
  }
}

/** Borra el perfil guardado en este navegador. */
export function olvidarPerfil(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CLAVE);
  } catch (error) {
    console.warn("No se pudo borrar el perfil:", error);
  }
}

/**
 * Fuente de perfil intercambiable (local o nube).
 * La página y el respaldo la reciben por props y no saben cuál usan.
 */
export interface BackendPerfil {
  cargar: () => Promise<Perfil | null>;
  guardar: (perfil: Perfil) => Promise<void>;
}

/** Implementación local con `localStorage`. */
export const backendLocalPerfil: BackendPerfil = {
  cargar: async () => cargarPerfil(),
  guardar: async (perfil) => {
    guardarPerfil(perfil);
  },
};
