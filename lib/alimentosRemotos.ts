import type { Alimento } from "@/lib/tipos";

// Búsqueda online bajo demanda en Open Food Facts (gratis, sin clave).
// Solo se llama al pulsar "Buscar online": sin conexión recurrente en
// segundo plano. Lo elegido se guarda en "mis alimentos" y así queda en caché.

/** Un alimento traído de online, con su marca si la dice la API. */
export interface AlimentoOnline extends Alimento {
  marca?: string;
}

interface ProductoOFF {
  product_name?: unknown;
  product_name_es?: unknown;
  brands?: unknown;
  nutriments?: Record<string, unknown>;
}

function numero(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) && valor >= 0
    ? valor
    : null;
}

/** Pasa un producto de Open Food Facts a alimento por 100 g (o null). */
export function mapearProducto(producto: ProductoOFF): AlimentoOnline | null {
  const crudo =
    typeof producto.product_name_es === "string" && producto.product_name_es.trim() !== ""
      ? producto.product_name_es
      : typeof producto.product_name === "string"
        ? producto.product_name
        : "";
  const nombre = crudo.trim();
  if (!nombre) return null;
  const n = producto.nutriments ?? {};
  // La energía a veces viene en kJ: 1 kcal = 4,184 kJ.
  const energiaKj = numero(n["energy_100g"]);
  const kcal =
    numero(n["energy-kcal_100g"]) ??
    (energiaKj !== null ? Math.round((energiaKj / 4.184) * 10) / 10 : null);
  if (kcal === null) return null;
  const marca = typeof producto.brands === "string" ? producto.brands.trim() : "";
  return {
    nombre,
    kcal,
    carbos: numero(n["carbohydrates_100g"]) ?? 0,
    proteinas: numero(n["proteins_100g"] ?? n["proteines_100g"]) ?? 0,
    grasas: numero(n["fat_100g"]) ?? 0,
    ...(marca ? { marca: marca.split(",")[0].trim() } : {}),
  };
}

/**
 * Busca alimentos por nombre en Open Food Facts. Devuelve hasta 10.
 * Falla con error si no hay red o la API responde mal.
 */
export async function buscarOnline(
  texto: string,
  senal?: AbortSignal
): Promise<AlimentoOnline[]> {
  const buscado = texto.trim();
  if (!buscado) return [];
  const url =
    "https://world.openfoodfacts.org/cgi/search.pl?search_terms=" +
    encodeURIComponent(buscado) +
    "&search_simple=1&action=process&json=1&page_size=10";
  const respuesta = await fetch(url, { signal: senal });
  if (!respuesta.ok) throw new Error("La búsqueda online falló.");
  const datos: unknown = await respuesta.json();
  const productos =
    typeof datos === "object" && datos !== null && Array.isArray((datos as { products?: unknown }).products)
      ? ((datos as { products: ProductoOFF[] }).products ?? [])
      : [];
  const alimentos: AlimentoOnline[] = [];
  for (const p of productos) {
    const alimento = mapearProducto(p);
    if (alimento) alimentos.push(alimento);
    if (alimentos.length >= 10) break;
  }
  return alimentos;
}
