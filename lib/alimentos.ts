import type { Alimento, Comida } from "@/lib/tipos";
import { hoyISO, moverDias } from "@/lib/fechas";

// Base local de alimentos (valores aprox. por 100 g).
// Sin APIs ni dependencias: funciona sin conexión y es fácil de ampliar.

/** Base inicial: unos 20 alimentos comunes. */
export const ALIMENTOS_BASE: Alimento[] = [
  { nombre: "pan", kcal: 265, carbos: 49, proteinas: 9, grasas: 3.2, alias: ["pao", "pão", "pan blanco"] },
  { nombre: "pan integral", kcal: 247, carbos: 41, proteinas: 13, grasas: 3.4 },
  { nombre: "arroz blanco cocido", kcal: 130, carbos: 28, proteinas: 2.7, grasas: 0.3, alias: ["arroz"] },
  { nombre: "arroz integral cocido", kcal: 111, carbos: 23, proteinas: 2.6, grasas: 0.9 },
  { nombre: "pasta cocida", kcal: 131, carbos: 25, proteinas: 5, grasas: 1.1, alias: ["macarrones", "espaguetis"] },
  { nombre: "avena", kcal: 389, carbos: 66, proteinas: 17, grasas: 7 },
  { nombre: "patata cocida", kcal: 87, carbos: 20, proteinas: 1.9, grasas: 0.1, alias: ["patata", "papa"] },
  { nombre: "lentejas cocidas", kcal: 116, carbos: 20, proteinas: 9, grasas: 0.4, alias: ["lentejas"] },
  { nombre: "huevo", kcal: 155, carbos: 1.1, proteinas: 13, grasas: 11, alias: ["huevos"] },
  { nombre: "pechuga de pollo", kcal: 165, carbos: 0, proteinas: 31, grasas: 3.6, alias: ["pollo"] },
  { nombre: "ternera", kcal: 250, carbos: 0, proteinas: 26, grasas: 15 },
  { nombre: "lomo de cerdo", kcal: 143, carbos: 0, proteinas: 26, grasas: 3.5, alias: ["cerdo"] },
  { nombre: "atún al natural", kcal: 108, carbos: 0, proteinas: 24, grasas: 1, alias: ["atun"] },
  { nombre: "leche entera", kcal: 64, carbos: 4.8, proteinas: 3.3, grasas: 3.6, alias: ["leche"] },
  { nombre: "yogur natural", kcal: 59, carbos: 3.6, proteinas: 3.5, grasas: 3.3, alias: ["yogur"] },
  { nombre: "queso curado", kcal: 404, carbos: 1.3, proteinas: 25, grasas: 33, alias: ["queso"] },
  { nombre: "plátano", kcal: 89, carbos: 23, proteinas: 1.1, grasas: 0.3, alias: ["platano", "banana"] },
  { nombre: "manzana", kcal: 52, carbos: 14, proteinas: 0.3, grasas: 0.2 },
  { nombre: "aceite de oliva", kcal: 884, carbos: 0, proteinas: 0, grasas: 100, alias: ["aceite"] },
  { nombre: "almendras", kcal: 579, carbos: 22, proteinas: 21, grasas: 50 },
];

/** Normaliza para comparar: minúsculas, sin espacios de más ni acentos. */
export function normalizarAlimento(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Busca un alimento por nombre: primero coincidencia exacta (nombre o alias),
 * si no, el primero que lo contenga ("arro" → arroz). Devuelve null si no hay.
 */
export function buscarAlimento(nombre: string, base: Alimento[] = ALIMENTOS_BASE): Alimento | null {
  const buscado = normalizarAlimento(nombre);
  if (!buscado) return null;
  const exacto = base.find(
    (a) =>
      normalizarAlimento(a.nombre) === buscado ||
      (a.alias ?? []).some((alias) => normalizarAlimento(alias) === buscado)
  );
  if (exacto) return exacto;
  return (
    base.find(
      (a) =>
        normalizarAlimento(a.nombre).includes(buscado) ||
        (a.alias ?? []).some((alias) => normalizarAlimento(alias).includes(buscado))
    ) ?? null
  );
}

/** Redondea a 1 decimal para mostrar números cortos. */
export function redondear1(valor: number): number {
  return Math.round(valor * 10) / 10;
}

/** Calcula los nutrientes para unos gramos desde la base por 100 g. */
export function calcularNutrientes(
  alimento: Alimento,
  gramos: number
): { kcal: number; carbos: number; proteinas: number; grasas: number } {
  if (!Number.isFinite(gramos) || gramos <= 0) {
    return { kcal: 0, carbos: 0, proteinas: 0, grasas: 0 };
  }
  const factor = gramos / 100;
  return {
    kcal: redondear1(alimento.kcal * factor),
    carbos: redondear1(alimento.carbos * factor),
    proteinas: redondear1(alimento.proteinas * factor),
    grasas: redondear1(alimento.grasas * factor),
  };
}

/** Comprueba que un dato leído tiene forma de comida válida. */
export function esComida(dato: unknown): dato is Comida {
  if (typeof dato !== "object" || dato === null) return false;
  const c = dato as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.fecha === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(c.fecha as string) &&
    typeof c.nombre === "string" &&
    typeof c.gramos === "number" &&
    Number.isFinite(c.gramos) &&
    (c.gramos as number) > 0 &&
    typeof c.kcal === "number" &&
    typeof c.carbos === "number" &&
    typeof c.proteinas === "number" &&
    typeof c.grasas === "number" &&
    typeof c.creadaEn === "number"
  );
}

/**
 * Crea una comida calculando sola sus nutrientes desde el alimento y los gramos.
 * El `id` sigue el patrón del formulario de sesiones (sin dependencias).
 */
export function crearComida(fecha: string, alimento: Alimento, gramos: number): Comida {
  const nutrientes = calcularNutrientes(alimento, gramos);
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    fecha,
    nombre: alimento.nombre,
    gramos,
    ...nutrientes,
    creadaEn: Date.now(),
  };
}

/** Suma los nutrientes de las comidas de un día ("YYYY-MM-DD"). */
export function totalesDelDia(
  comidas: Comida[],
  fecha: string
): { kcal: number; carbos: number; proteinas: number; grasas: number } {
  const totales = { kcal: 0, carbos: 0, proteinas: 0, grasas: 0 };
  for (const c of comidas) {
    if (c.fecha !== fecha) continue;
    totales.kcal = redondear1(totales.kcal + c.kcal);
    totales.carbos = redondear1(totales.carbos + c.carbos);
    totales.proteinas = redondear1(totales.proteinas + c.proteinas);
    totales.grasas = redondear1(totales.grasas + c.grasas);
  }
  return totales;
}

/** Un día con su etiqueta corta y sus totales de dieta. */
export interface DiaDieta {
  fecha: string;
  etiqueta: string;
  kcal: number;
  carbos: number;
  proteinas: number;
  grasas: number;
}

/** Etiqueta corta de una fecha, por ejemplo "12 ene" (local, nunca UTC). */
function etiquetaCorta(iso: string): string {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(
    new Date(anio, mes - 1, dia)
  );
}

/**
 * Totales de dieta de los últimos `dias` días, terminando hoy.
 * Los días sin comidas salen con ceros para que la barra quede vacía.
 */
export function kcalPorDia(comidas: Comida[], dias = 7): DiaDieta[] {
  const hoy = hoyISO();
  return Array.from({ length: dias }, (_, i) => {
    const fecha = moverDias(hoy, -(dias - 1 - i));
    return { fecha, etiqueta: etiquetaCorta(fecha), ...totalesDelDia(comidas, fecha) };
  });
}

// Guardado local de comidas (clave propia, como las plantillas).
// Solo se usa en cliente: sin window devuelve [] / no-op.

const CLAVE_COMIDAS = "gymtrack_comidas";

/** Ordena las comidas de la más reciente a la más antigua. */
export function ordenarComidas(comidas: Comida[]): Comida[] {
  return [...comidas].sort((a, b) => {
    if (a.fecha === b.fecha) return (b.creadaEn ?? 0) - (a.creadaEn ?? 0);
    return a.fecha < b.fecha ? 1 : -1;
  });
}

/** Carga las comidas guardadas. Devuelve un array (vacío si no hay nada). */
export function cargarComidas(): Comida[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = window.localStorage.getItem(CLAVE_COMIDAS);
    if (!bruto) return [];
    const datos: unknown = JSON.parse(bruto);
    return Array.isArray(datos) ? datos.filter(esComida) : [];
  } catch (error) {
    console.warn("No se pudieron leer las comidas guardadas:", error);
    return [];
  }
}

/** Guarda la lista completa de comidas. */
export function guardarComidas(comidas: Comida[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAVE_COMIDAS, JSON.stringify(comidas));
  } catch (error) {
    console.warn("No se pudieron guardar las comidas:", error);
  }
}

/** Borra las comidas guardadas en este navegador. */
export function olvidarComidas(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CLAVE_COMIDAS);
  } catch (error) {
    console.warn("No se pudieron borrar las comidas:", error);
  }
}

/**
 * Fuente de comidas intercambiable (local o nube).
 * El formulario de dieta y el respaldo la reciben por props.
 */
export interface BackendComidas {
  cargar: () => Promise<Comida[]>;
  guardar: (comidas: Comida[]) => Promise<void>;
}

/** Implementación local con `localStorage`. */
export const backendLocalComidas: BackendComidas = {
  cargar: async () => cargarComidas(),
  guardar: async (comidas) => {
    guardarComidas(comidas);
  },
};
