import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase para el navegador. Usa solo la clave anónima (pública por
// diseño); la `service_role` no existe en este proyecto.
export function crearClienteSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonima = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonima) {
    throw new Error("Falta configurar Supabase en .env.local (ver .env.example).");
  }
  return createBrowserClient(url, anonima);
}

/** Indica si hay configuración de Supabase disponible. */
export function haySupabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
