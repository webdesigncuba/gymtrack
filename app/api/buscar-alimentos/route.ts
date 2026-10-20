// Proxy server-side hacia Open Food Facts (API v2, gratis sin clave).
// El navegador NO llama a OFF directamente: desde cliente falla por CORS
// (y OFF exige User-Agent, cabecera que el navegador no deja poner).
// El servidor sí puede poner User-Agent y no tiene CORS.

/** Respuesta mínima que reenviamos al cliente. */
interface ProxyOFF {
  products: unknown[];
}

/** Espera unos ms (para reintentar tras un 503/429 de OFF). */
function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

export async function GET(solicitud: Request): Promise<Response> {
  const parametros = new URL(solicitud.url).searchParams;
  const buscado = (parametros.get("q") ?? "").trim().slice(0, 80);
  if (!buscado) {
    const vacio: ProxyOFF = { products: [] };
    return Response.json(vacio);
  }
  const url =
    "https://world.openfoodfacts.org/api/v2/search?search_terms=" +
    encodeURIComponent(buscado) +
    "&page_size=10&json=1&fields=product_name,product_name_es,brands,nutriments";
  // OFF limita las búsquedas (503/429): reintentamos 3 veces con espera.
  for (let intento = 1; intento <= 3; intento++) {
    const control = new AbortController();
    const cuentaAtras = setTimeout(() => control.abort(), 15000);
    try {
      const respuesta = await fetch(url, {
        headers: { "User-Agent": "GymTrack/2.0 (busqueda de alimentos)" },
        signal: control.signal,
      });
      if (respuesta.status === 503 || respuesta.status === 429) {
        if (intento < 3) {
          await esperar(600 * intento);
          continue;
        }
        return Response.json(
          { error: "Open Food Facts está saturado ahora mismo." },
          { status: 502 }
        );
      }
      if (!respuesta.ok) {
        return Response.json({ error: "Open Food Facts no responde." }, { status: 502 });
      }
      const datos: unknown = await respuesta.json();
      const productos =
        typeof datos === "object" && datos !== null && Array.isArray((datos as { products?: unknown }).products)
          ? (datos as { products: unknown[] }).products
          : [];
      const proxy: ProxyOFF = { products: productos.slice(0, 10) };
      return Response.json(proxy);
    } catch (error) {
      // Abort o red caída: reintenta, salvo en el último intento.
      if (intento < 3) {
        await esperar(600 * intento);
        continue;
      }
      console.warn("El proxy de Open Food Facts falló:", error);
      return Response.json({ error: "Open Food Facts inalcanzable." }, { status: 502 });
    } finally {
      clearTimeout(cuentaAtras);
    }
  }
  return Response.json({ error: "Open Food Facts no responde." }, { status: 502 });
}
