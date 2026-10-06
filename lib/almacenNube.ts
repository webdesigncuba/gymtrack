import type { SupabaseClient } from "@supabase/supabase-js";
import type { Almacen } from "@/lib/almacen";
import { esComida, type BackendComidas } from "@/lib/alimentos";
import { esPerfil, normalizarPerfil, type BackendPerfil } from "@/lib/perfil";
import type { BackendPlantillas, Plantilla } from "@/lib/plantillas";
import type { Comida, Perfil, Sesion } from "@/lib/tipos";

// Implementación de `Almacen` contra Supabase (una sesión por usuario y día).
// Estrategia simple y predecible: guardar reemplaza todas las sesiones del
// usuario (igual que la restauración del respaldo).

/** Fila de la tabla `sesiones` tal como la devuelve Supabase. */
interface FilaSesion {
  id: unknown;
  fecha: unknown;
  creada_en: unknown;
  ejercicios: unknown;
}

/** Convierte una tanda leída en { reps, peso } de texto. */
function aTanda(tanda: unknown): { reps: string; peso: string } {
  const t = (typeof tanda === "object" && tanda !== null ? tanda : {}) as Record<
    string,
    unknown
  >;
  return {
    reps: typeof t.reps === "string" ? t.reps : "",
    peso: typeof t.peso === "string" ? t.peso : "",
  };
}

/** Convierte una fila en sesión válida, o null si no sirve. */
function aSesion(fila: FilaSesion): Sesion | null {
  if (typeof fila.id !== "string" || typeof fila.fecha !== "string") return null;
  if (!Array.isArray(fila.ejercicios)) return null;
  const creadaEn = typeof fila.creada_en === "number" ? fila.creada_en : Date.now();
  const ejercicios = fila.ejercicios
    .filter(
      (e): e is { nombre: unknown; tandas: unknown; observaciones?: unknown } =>
        typeof e === "object" && e !== null
    )
    .filter((e) => typeof e.nombre === "string" && Array.isArray(e.tandas))
    .map((e) => ({
      nombre: e.nombre as string,
      // La observación es opcional y vive en el jsonb: la pasamos si viene.
      ...(typeof e.observaciones === "string" && e.observaciones.trim() !== ""
        ? { observaciones: e.observaciones }
        : {}),
      tandas: (e.tandas as unknown[]).map(aTanda),
    }));
  return { id: fila.id, fecha: fila.fecha, creadaEn, ejercicios };
}

/** Crea el almacén en la nube para un usuario. */
export function almacenNube(
  supabase: SupabaseClient,
  userId: string
): Almacen {
  return {
    cargar: async () => {
      const { data, error } = await supabase
        .from("sesiones")
        .select("id, fecha, creada_en, ejercicios")
        .eq("user_id", userId);
      if (error) {
        console.warn("No se pudieron cargar las sesiones de la nube:", error);
        return [];
      }
      const sesiones: Sesion[] = [];
      for (const fila of (data ?? []) as FilaSesion[]) {
        const sesion = aSesion(fila);
        if (sesion) sesiones.push(sesion);
      }
      return sesiones;
    },
    guardar: async (sesiones: Sesion[]) => {
      const borrado = await supabase.from("sesiones").delete().eq("user_id", userId);
      if (borrado.error) {
        console.warn("No se pudieron guardar las sesiones en la nube:", borrado.error);
        return;
      }
      if (sesiones.length === 0) return;
      const filas = sesiones.map((s) => ({
        id: s.id,
        user_id: userId,
        fecha: s.fecha,
        creada_en: s.creadaEn,
        ejercicios: s.ejercicios,
      }));
      const insertado = await supabase.from("sesiones").insert(filas);
      if (insertado.error) {
        console.warn("No se pudieron guardar las sesiones en la nube:", insertado.error);
      }
    },
  };
}

/** Fila de la tabla `plantillas` tal como la devuelve Supabase. */
interface FilaPlantilla {
  id: unknown;
  nombre: unknown;
  creada_en: unknown;
  ejercicios: unknown;
}

/** Convierte una fila en plantilla válida, o null si no sirve. */
function aPlantilla(fila: FilaPlantilla): Plantilla | null {
  if (typeof fila.id !== "string" || typeof fila.nombre !== "string") return null;
  if (!Array.isArray(fila.ejercicios)) return null;
  const creadaEn = typeof fila.creada_en === "number" ? fila.creada_en : Date.now();
  const ejercicios = fila.ejercicios
    .filter(
      (e): e is { nombre: unknown; tandas: unknown } =>
        typeof e === "object" && e !== null
    )
    .filter((e) => typeof e.nombre === "string" && typeof e.tandas === "number")
    .map((e) => ({ nombre: e.nombre as string, tandas: e.tandas as number }));
  return { id: fila.id, nombre: fila.nombre, creadaEn, ejercicios };
}

/** Fuente de plantillas en la nube para un usuario. */
export function backendNubePlantillas(
  supabase: SupabaseClient,
  userId: string
): BackendPlantillas {
  return {
    cargar: async () => {
      const { data, error } = await supabase
        .from("plantillas")
        .select("id, nombre, creada_en, ejercicios")
        .eq("user_id", userId);
      if (error) {
        console.warn("No se pudieron cargar las plantillas de la nube:", error);
        return [];
      }
      const plantillas: Plantilla[] = [];
      for (const fila of (data ?? []) as FilaPlantilla[]) {
        const plantilla = aPlantilla(fila);
        if (plantilla) plantillas.push(plantilla);
      }
      return plantillas;
    },
    guardar: async (plantillas: Plantilla[]) => {
      const borrado = await supabase.from("plantillas").delete().eq("user_id", userId);
      if (borrado.error) {
        console.warn("No se pudieron guardar las plantillas en la nube:", borrado.error);
        return;
      }
      if (plantillas.length === 0) return;
      const filas = plantillas.map((p) => ({
        id: p.id,
        user_id: userId,
        nombre: p.nombre,
        creada_en: p.creadaEn,
        ejercicios: p.ejercicios,
      }));
      const insertado = await supabase.from("plantillas").insert(filas);
      if (insertado.error) {
        console.warn("No se pudieron guardar las plantillas en la nube:", insertado.error);
      }
    },
  };
}

/** Fila de la tabla `comidas` tal como la devuelve Supabase. */
interface FilaComida {
  id: unknown;
  fecha: unknown;
  nombre: unknown;
  gramos: unknown;
  kcal: unknown;
  carbos: unknown;
  proteinas: unknown;
  grasas: unknown;
  creada_en: unknown;
}

/** Convierte una fila en comida válida, o null si no sirve. */
function aComida(fila: FilaComida): Comida | null {
  const comida = {
    id: fila.id,
    fecha: fila.fecha,
    nombre: fila.nombre,
    gramos: fila.gramos,
    kcal: fila.kcal,
    carbos: fila.carbos,
    proteinas: fila.proteinas,
    grasas: fila.grasas,
    creadaEn: typeof fila.creada_en === "number" ? fila.creada_en : Date.now(),
  };
  return esComida(comida) ? comida : null;
}

/** Fuente de comidas en la nube para un usuario (una cuenta solo ve lo suyo). */
export function backendNubeComidas(
  supabase: SupabaseClient,
  userId: string
): BackendComidas {
  return {
    cargar: async () => {
      const { data, error } = await supabase
        .from("comidas")
        .select("id, fecha, nombre, gramos, kcal, carbos, proteinas, grasas, creada_en")
        .eq("user_id", userId);
      if (error) {
        console.warn("No se pudieron cargar las comidas de la nube:", error);
        return [];
      }
      const comidas: Comida[] = [];
      for (const fila of (data ?? []) as FilaComida[]) {
        const comida = aComida(fila);
        if (comida) comidas.push(comida);
      }
      return comidas;
    },
    guardar: async (comidas: Comida[]) => {
      const borrado = await supabase.from("comidas").delete().eq("user_id", userId);
      if (borrado.error) {
        console.warn("No se pudieron guardar las comidas en la nube:", borrado.error);
        return;
      }
      if (comidas.length === 0) return;
      const filas = comidas.map((c) => ({
        id: c.id,
        user_id: userId,
        fecha: c.fecha,
        nombre: c.nombre,
        gramos: c.gramos,
        kcal: c.kcal,
        carbos: c.carbos,
        proteinas: c.proteinas,
        grasas: c.grasas,
        creada_en: c.creadaEn,
      }));
      const insertado = await supabase.from("comidas").insert(filas);
      if (insertado.error) {
        console.warn("No se pudieron guardar las comidas en la nube:", insertado.error);
      }
    },
  };
}

/** Fila de la tabla `perfiles` tal como la devuelve Supabase. */
interface FilaPerfil {
  edad_anos: unknown;
  estatura_cm: unknown;
  peso_kg: unknown;
  sexo: unknown;
  actividad: unknown;
  objetivo: unknown;
}

/** Fuente de perfil en la nube para un usuario (uno por cuenta). */
export function backendNubePerfil(
  supabase: SupabaseClient,
  userId: string
): BackendPerfil {
  return {
    cargar: async () => {
      const { data, error } = await supabase
        .from("perfiles")
        .select("edad_anos, estatura_cm, peso_kg, sexo, actividad, objetivo")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        console.warn("No se pudo cargar el perfil de la nube:", error);
        return null;
      }
      if (!data) return null;
      const fila = data as FilaPerfil;
      const perfil: Perfil = {
        edadAnos: typeof fila.edad_anos === "number" ? fila.edad_anos : null,
        estaturaCm: typeof fila.estatura_cm === "number" ? fila.estatura_cm : null,
        pesoKg: typeof fila.peso_kg === "number" ? fila.peso_kg : null,
        sexo: typeof fila.sexo === "string" ? (fila.sexo as Perfil["sexo"]) : null,
        actividad:
          typeof fila.actividad === "string" ? (fila.actividad as Perfil["actividad"]) : null,
        objetivo:
          typeof fila.objetivo === "string" ? (fila.objetivo as Perfil["objetivo"]) : null,
      };
      return esPerfil(perfil) ? normalizarPerfil(perfil) : null;
    },
    guardar: async (perfil: Perfil) => {
      const fila = {
        user_id: userId,
        edad_anos: perfil.edadAnos,
        estatura_cm: perfil.estaturaCm,
        peso_kg: perfil.pesoKg,
        sexo: perfil.sexo,
        actividad: perfil.actividad,
        objetivo: perfil.objetivo,
        actualizada_en: Date.now(),
      };
      const guardado = await supabase.from("perfiles").upsert(fila);
      if (guardado.error) {
        console.warn("No se pudo guardar el perfil en la nube:", guardado.error);
      }
    },
  };
}
