import type { Alimento, Comida } from "@/lib/tipos";
import { hoyISO, moverDias } from "@/lib/fechas";

// Base local de alimentos (valores aprox. por 100 g).
// Sin APIs ni dependencias: funciona sin conexión y es fácil de ampliar.

/** Base inicial: alimentos comunes con alias en español (valores aprox. por 100 g). */
export const ALIMENTOS_BASE: Alimento[] = [
  { nombre: "pan", kcal: 265, carbos: 49, proteinas: 9, grasas: 3.2, alias: ["pao", "pão", "pan blanco"] },
  { nombre: "pan integral", kcal: 247, carbos: 41, proteinas: 13, grasas: 3.4 },
  { nombre: "pan de molde", kcal: 265, carbos: 49, proteinas: 9, grasas: 3.3, alias: ["pan molde", "pan bimbo"] },
  { nombre: "tortilla de trigo", kcal: 310, carbos: 56, proteinas: 8, grasas: 7, alias: ["tortilla", "fajita", "wrap"] },
  { nombre: "tortilla de maíz", kcal: 220, carbos: 45, proteinas: 5, grasas: 2, alias: ["tortilla mexicana", "maiz"] },
  { nombre: "arroz blanco cocido", kcal: 130, carbos: 28, proteinas: 2.7, grasas: 0.3, alias: ["arroz"] },
  { nombre: "arroz integral cocido", kcal: 111, carbos: 23, proteinas: 2.6, grasas: 0.9 },
  { nombre: "arroz basmati cocido", kcal: 121, carbos: 26, proteinas: 3, grasas: 0.4, alias: ["basmati"] },
  { nombre: "pasta cocida", kcal: 131, carbos: 25, proteinas: 5, grasas: 1.1, alias: ["macarrones", "espaguetis"] },
  { nombre: "cuscús cocido", kcal: 112, carbos: 23, proteinas: 3.8, grasas: 0.2, alias: ["cuscus"] },
  { nombre: "quinoa cocida", kcal: 120, carbos: 21, proteinas: 4.4, grasas: 1.9, alias: ["quinoa"] },
  { nombre: "avena", kcal: 389, carbos: 66, proteinas: 17, grasas: 7 },
  { nombre: "harina de trigo", kcal: 364, carbos: 76, proteinas: 10, grasas: 1, alias: ["harina"] },
  { nombre: "harina de avena", kcal: 362, carbos: 65, proteinas: 13, grasas: 7 },
  { nombre: "cereales de maíz", kcal: 375, carbos: 82, proteinas: 7, grasas: 1.5, alias: ["corn flakes", "cereales"] },
  { nombre: "muesli", kcal: 375, carbos: 65, proteinas: 10, grasas: 8 },
  { nombre: "galletas maría", kcal: 450, carbos: 73, proteinas: 7, grasas: 15, alias: ["galletas", "galleta"] },
  { nombre: "magdalena", kcal: 380, carbos: 55, proteinas: 5, grasas: 15 },
  { nombre: "croissant", kcal: 406, carbos: 45, proteinas: 8, grasas: 21, alias: ["cruasan"] },
  { nombre: "patata cocida", kcal: 87, carbos: 20, proteinas: 1.9, grasas: 0.1, alias: ["patata", "papa"] },
  { nombre: "boniato", kcal: 86, carbos: 20, proteinas: 1.6, grasas: 0.1, alias: ["batata", "camote"] },
  { nombre: "maíz dulce", kcal: 96, carbos: 21, proteinas: 3.4, grasas: 1.5, alias: ["maiz", "elote"] },
  { nombre: "puré de patata", kcal: 85, carbos: 18, proteinas: 2, grasas: 0.5, alias: ["pure"] },
  { nombre: "tortilla de patata", kcal: 150, carbos: 14, proteinas: 6, grasas: 8, alias: ["tortilla española"] },
  { nombre: "gazpacho", kcal: 45, carbos: 6, proteinas: 1, grasas: 2 },
  { nombre: "patatas fritas", kcal: 536, carbos: 53, proteinas: 6.5, grasas: 35, alias: ["patatas chips", "sabritas"] },
  { nombre: "palomitas", kcal: 375, carbos: 74, proteinas: 11, grasas: 4.4, alias: ["palomitas de maiz", "pochoclo"] },
  { nombre: "lentejas cocidas", kcal: 116, carbos: 20, proteinas: 9, grasas: 0.4, alias: ["lentejas"] },
  { nombre: "garbanzos cocidos", kcal: 164, carbos: 27, proteinas: 9, grasas: 2.6, alias: ["garbanzos"] },
  { nombre: "judías blancas cocidas", kcal: 132, carbos: 24, proteinas: 8.5, grasas: 0.5, alias: ["judias", "alubias", "fabes"] },
  { nombre: "guisantes", kcal: 81, carbos: 14, proteinas: 5.4, grasas: 0.4, alias: ["guisante", "arvejas"] },
  { nombre: "tofu", kcal: 76, carbos: 1.9, proteinas: 8, grasas: 4.8 },
  { nombre: "hummus", kcal: 166, carbos: 14, proteinas: 7.9, grasas: 9.6 },
  { nombre: "soja texturizada seca", kcal: 340, carbos: 30, proteinas: 50, grasas: 2, alias: ["soja", "soya"] },
  { nombre: "brócoli", kcal: 34, carbos: 6.6, proteinas: 2.8, grasas: 0.4, alias: ["brocoli", "brecol"] },
  { nombre: "coliflor", kcal: 25, carbos: 5, proteinas: 1.9, grasas: 0.3 },
  { nombre: "espinacas", kcal: 23, carbos: 3.6, proteinas: 2.9, grasas: 0.4, alias: ["espinaca"] },
  { nombre: "lechuga", kcal: 15, carbos: 2.9, proteinas: 1.4, grasas: 0.2 },
  { nombre: "tomate", kcal: 18, carbos: 3.9, proteinas: 0.9, grasas: 0.2, alias: ["jitomate"] },
  { nombre: "zanahoria", kcal: 41, carbos: 10, proteinas: 0.9, grasas: 0.2 },
  { nombre: "cebolla", kcal: 40, carbos: 9.3, proteinas: 1.1, grasas: 0.1 },
  { nombre: "pimiento", kcal: 31, carbos: 6, proteinas: 1, grasas: 0.3, alias: ["pimiento rojo", "morron"] },
  { nombre: "calabacín", kcal: 17, carbos: 3.1, proteinas: 1.2, grasas: 0.3, alias: ["calabacin", "zapallo italiano"] },
  { nombre: "pepino", kcal: 15, carbos: 3.6, proteinas: 0.7, grasas: 0.1 },
  { nombre: "champiñones", kcal: 22, carbos: 3.3, proteinas: 3.1, grasas: 0.3, alias: ["champiñones", "setas"] },
  { nombre: "espárragos", kcal: 20, carbos: 3.9, proteinas: 2.2, grasas: 0.1, alias: ["esparragos"] },
  { nombre: "berenjena", kcal: 25, carbos: 6, proteinas: 1, grasas: 0.2 },
  { nombre: "puerro", kcal: 61, carbos: 14, proteinas: 1.5, grasas: 0.3, alias: ["poro"] },
  { nombre: "huevo", kcal: 155, carbos: 1.1, proteinas: 13, grasas: 11, alias: ["huevos"] },
  { nombre: "clara de huevo", kcal: 52, carbos: 0.7, proteinas: 11, grasas: 0.2, alias: ["claras"] },
  { nombre: "pechuga de pollo", kcal: 165, carbos: 0, proteinas: 31, grasas: 3.6, alias: ["pollo"] },
  { nombre: "pechuga de pavo", kcal: 135, carbos: 0, proteinas: 30, grasas: 1, alias: ["pavo"] },
  { nombre: "ternera", kcal: 250, carbos: 0, proteinas: 26, grasas: 15, alias: ["res", "carne de vaca"] },
  { nombre: "hamburguesa de ternera", kcal: 220, carbos: 0, proteinas: 20, grasas: 15, alias: ["hamburguesa"] },
  { nombre: "lomo de cerdo", kcal: 143, carbos: 0, proteinas: 26, grasas: 3.5, alias: ["cerdo", "puerco"] },
  { nombre: "conejo", kcal: 173, carbos: 0, proteinas: 33, grasas: 3.5 },
  { nombre: "jamón serrano", kcal: 241, carbos: 0, proteinas: 30, grasas: 13, alias: ["jamon", "jamon crudo"] },
  { nombre: "jamón york", kcal: 110, carbos: 3, proteinas: 16, grasas: 4, alias: ["jamon dulce", "york", "jamon cocido"] },
  { nombre: "chorizo", kcal: 455, carbos: 2, proteinas: 24, grasas: 38, alias: ["chorizo español"] },
  { nombre: "salchicha frankfurt", kcal: 280, carbos: 3, proteinas: 12, grasas: 25, alias: ["salchichas", "frankfurt", "vienesa"] },
  { nombre: "bacon", kcal: 541, carbos: 1.4, proteinas: 37, grasas: 42, alias: ["beicon", "panceta", "tocino"] },
  { nombre: "atún al natural", kcal: 108, carbos: 0, proteinas: 24, grasas: 1, alias: ["atun"] },
  { nombre: "atún en aceite", kcal: 200, carbos: 0, proteinas: 25, grasas: 10, alias: ["atun aceite"] },
  { nombre: "merluza", kcal: 90, carbos: 0, proteinas: 19, grasas: 2 },
  { nombre: "salmón", kcal: 208, carbos: 0, proteinas: 20, grasas: 13, alias: ["salmon"] },
  { nombre: "sardinas", kcal: 208, carbos: 0, proteinas: 24, grasas: 12, alias: ["sardina"] },
  { nombre: "caballa", kcal: 205, carbos: 0, proteinas: 19, grasas: 14 },
  { nombre: "gambas", kcal: 99, carbos: 0.2, proteinas: 24, grasas: 0.3, alias: ["gamba", "langostinos", "camarones"] },
  { nombre: "mejillones", kcal: 86, carbos: 3.7, proteinas: 12, grasas: 2.2, alias: ["mejillon", "choros"] },
  { nombre: "calamares", kcal: 92, carbos: 3.1, proteinas: 15.6, grasas: 1.4, alias: ["calamar", "chipirones"] },
  { nombre: "pulpo", kcal: 82, carbos: 2.2, proteinas: 15, grasas: 1 },
  { nombre: "bacalao", kcal: 105, carbos: 0, proteinas: 23, grasas: 1 },
  { nombre: "leche entera", kcal: 64, carbos: 4.8, proteinas: 3.3, grasas: 3.6, alias: ["leche"] },
  { nombre: "leche semidesnatada", kcal: 46, carbos: 4.8, proteinas: 3.3, grasas: 1.6 },
  { nombre: "leche desnatada", kcal: 34, carbos: 5, proteinas: 3.4, grasas: 0.1, alias: ["leche descremada"] },
  { nombre: "yogur natural", kcal: 59, carbos: 3.6, proteinas: 3.5, grasas: 3.3, alias: ["yogur"] },
  { nombre: "yogur griego", kcal: 97, carbos: 3.9, proteinas: 9, grasas: 5, alias: ["yogur griego natural"] },
  { nombre: "yogur desnatado", kcal: 40, carbos: 5.5, proteinas: 4.5, grasas: 0.2 },
  { nombre: "queso curado", kcal: 404, carbos: 1.3, proteinas: 25, grasas: 33, alias: ["queso"] },
  { nombre: "queso fresco", kcal: 100, carbos: 3.5, proteinas: 12, grasas: 4.5, alias: ["queso fresco batido", "requeson"] },
  { nombre: "mozzarella", kcal: 280, carbos: 2.2, proteinas: 28, grasas: 17, alias: ["mozarela"] },
  { nombre: "parmesano", kcal: 431, carbos: 4.1, proteinas: 38, grasas: 29 },
  { nombre: "queso de cabra", kcal: 264, carbos: 2, proteinas: 18, grasas: 21, alias: ["cabra"] },
  { nombre: "mantequilla", kcal: 717, carbos: 0.8, proteinas: 0.9, grasas: 81, alias: ["manteca"] },
  { nombre: "nata", kcal: 340, carbos: 3.4, proteinas: 2.8, grasas: 36, alias: ["crema de leche"] },
  { nombre: "kéfir", kcal: 55, carbos: 4, proteinas: 3.5, grasas: 3, alias: ["kefir"] },
  { nombre: "helado de vainilla", kcal: 207, carbos: 24, proteinas: 3.5, grasas: 11, alias: ["helado"] },
  { nombre: "plátano", kcal: 89, carbos: 23, proteinas: 1.1, grasas: 0.3, alias: ["platano", "banana"] },
  { nombre: "manzana", kcal: 52, carbos: 14, proteinas: 0.3, grasas: 0.2 },
  { nombre: "naranja", kcal: 47, carbos: 12, proteinas: 0.9, grasas: 0.1 },
  { nombre: "mandarina", kcal: 53, carbos: 13, proteinas: 0.8, grasas: 0.3, alias: ["clementina"] },
  { nombre: "pera", kcal: 57, carbos: 15, proteinas: 0.4, grasas: 0.1 },
  { nombre: "melocotón", kcal: 39, carbos: 10, proteinas: 0.9, grasas: 0.3, alias: ["melocoton", "durazno"] },
  { nombre: "uvas", kcal: 69, carbos: 18, proteinas: 0.7, grasas: 0.2, alias: ["uva"] },
  { nombre: "fresas", kcal: 32, carbos: 7.7, proteinas: 0.7, grasas: 0.3, alias: ["fresa", "frutilla"] },
  { nombre: "sandía", kcal: 30, carbos: 7.6, proteinas: 0.6, grasas: 0.2, alias: ["sandia"] },
  { nombre: "melón", kcal: 34, carbos: 8, proteinas: 0.8, grasas: 0.2, alias: ["melon"] },
  { nombre: "piña", kcal: 50, carbos: 13, proteinas: 0.5, grasas: 0.1, alias: ["pina", "ananas"] },
  { nombre: "kiwi", kcal: 61, carbos: 15, proteinas: 1.1, grasas: 0.5 },
  { nombre: "mango", kcal: 60, carbos: 15, proteinas: 0.8, grasas: 0.4 },
  { nombre: "aguacate", kcal: 160, carbos: 9, proteinas: 2, grasas: 15, alias: ["palta"] },
  { nombre: "cerezas", kcal: 63, carbos: 16, proteinas: 1, grasas: 0.2, alias: ["cereza", "picotas"] },
  { nombre: "arándanos", kcal: 57, carbos: 14, proteinas: 0.7, grasas: 0.3, alias: ["arandanos", "blueberry"] },
  { nombre: "dátiles", kcal: 282, carbos: 75, proteinas: 2.5, grasas: 0.4, alias: ["datiles", "datil"] },
  { nombre: "pasas", kcal: 299, carbos: 79, proteinas: 3, grasas: 0.5, alias: ["uvas pasas"] },
  { nombre: "aceitunas", kcal: 115, carbos: 4, proteinas: 1, grasas: 11, alias: ["aceitunas verdes", "olivas"] },
  { nombre: "coco rallado", kcal: 660, carbos: 24, proteinas: 7, grasas: 65, alias: ["coco"] },
  { nombre: "aceite de oliva", kcal: 884, carbos: 0, proteinas: 0, grasas: 100, alias: ["aceite"] },
  { nombre: "aceite de girasol", kcal: 884, carbos: 0, proteinas: 0, grasas: 100, alias: ["girasol"] },
  { nombre: "margarina", kcal: 722, carbos: 0.9, proteinas: 0.6, grasas: 80 },
  { nombre: "almendras", kcal: 579, carbos: 22, proteinas: 21, grasas: 50, alias: ["almendra"] },
  { nombre: "nueces", kcal: 654, carbos: 14, proteinas: 15, grasas: 65, alias: ["nuez"] },
  { nombre: "avellanas", kcal: 628, carbos: 17, proteinas: 15, grasas: 61, alias: ["avellana"] },
  { nombre: "cacahuetes", kcal: 567, carbos: 16, proteinas: 26, grasas: 49, alias: ["cacahuete", "mani", "manises"] },
  { nombre: "pistachos", kcal: 562, carbos: 28, proteinas: 20, grasas: 45, alias: ["pistacho"] },
  { nombre: "anacardos", kcal: 553, carbos: 30, proteinas: 18, grasas: 44, alias: ["castañas de caju", "merey"] },
  { nombre: "semillas de chía", kcal: 486, carbos: 42, proteinas: 17, grasas: 31, alias: ["chia"] },
  { nombre: "crema de cacahuete", kcal: 588, carbos: 20, proteinas: 25, grasas: 50, alias: ["crema de mani"] },
  { nombre: "azúcar", kcal: 387, carbos: 100, proteinas: 0, grasas: 0, alias: ["azucar"] },
  { nombre: "miel", kcal: 304, carbos: 82, proteinas: 0.3, grasas: 0 },
  { nombre: "mermelada", kcal: 250, carbos: 63, proteinas: 0.4, grasas: 0.1 },
  { nombre: "chocolate negro", kcal: 546, carbos: 61, proteinas: 4.9, grasas: 31, alias: ["chocolate"] },
  { nombre: "chocolate con leche", kcal: 535, carbos: 59, proteinas: 8, grasas: 30 },
  { nombre: "cacao en polvo", kcal: 255, carbos: 22, proteinas: 20, grasas: 12, alias: ["cacao", "colacao", "nesquik"] },
  { nombre: "ketchup", kcal: 112, carbos: 27, proteinas: 1.3, grasas: 0.1, alias: ["ketchup", "catsup"] },
  { nombre: "mayonesa", kcal: 680, carbos: 1, proteinas: 1, grasas: 75, alias: ["mahonesa"] },
  { nombre: "zumo de naranja", kcal: 45, carbos: 10.4, proteinas: 0.7, grasas: 0.2, alias: ["zumo", "jugo de naranja"] },
  { nombre: "refresco de cola", kcal: 42, carbos: 10.6, proteinas: 0, grasas: 0, alias: ["coca cola", "refresco", "gaseosa"] },
  { nombre: "cerveza", kcal: 43, carbos: 3.6, proteinas: 0.5, grasas: 0 },
  { nombre: "vino tinto", kcal: 83, carbos: 2.6, proteinas: 0.1, grasas: 0, alias: ["vino"] },
  { nombre: "café con leche", kcal: 45, carbos: 5, proteinas: 3, grasas: 2, alias: ["cafe"] },
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
