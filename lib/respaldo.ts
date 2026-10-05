import { esSesion } from "@/lib/datos";
import { esComida } from "@/lib/alimentos";
import { esAlimento } from "@/lib/alimentosCustom";
import { esPerfil } from "@/lib/perfil";
import { esPlantilla } from "@/lib/plantillas";
import type { Plantilla } from "@/lib/plantillas";
import type { Alimento, Comida, Perfil, Sesion } from "@/lib/tipos";

// Respaldo versionado en un solo JSON: { version: 4, sesiones, plantillas, comidas, perfil, alimentosCustom }.
// Cada clave se valida por separado: lo inválido de una no bloquea la otra.
// El formato antiguo (un array) se acepta como solo-sesiones, la v1 como
// respaldo sin comidas ni perfil, la v2 como respaldo sin perfil y la v3
// como respaldo sin alimentos personalizados.

/** Versión actual del formato de respaldo. */
export const VERSION_RESPALDO = 4;

/** Contenido de un archivo de respaldo. */
export interface Respaldo {
  version: number;
  sesiones: Sesion[];
  plantillas: Plantilla[];
  comidas: Comida[];
  /** Perfil del dueño (null si no lo rellenó). */
  perfil: Perfil | null;
  /** Alimentos personalizados ("mis alimentos"). */
  alimentosCustom: Alimento[];
  /** Email del dueño (informativo, para saber de quién era al restaurar). */
  usuario?: string;
}

/** Resultado de leer un respaldo: lo válido por clave y lo descartado. */
export interface RespaldoLeido {
  sesiones: Sesion[];
  plantillas: Plantilla[];
  comidas: Comida[];
  perfil: Perfil | null;
  alimentosCustom: Alimento[];
  conPlantillas: boolean;
  conComidas: boolean;
  conPerfil: boolean;
  conAlimentos: boolean;
  descartadasSesiones: number;
  descartadasPlantillas: number;
  descartadasComidas: number;
  descartadosAlimentos: number;
}

/** Construye el objeto a descargar. */
export function construirRespaldo(
  sesiones: Sesion[],
  plantillas: Plantilla[],
  usuario?: string | null,
  comidas: Comida[] = [],
  perfil: Perfil | null = null,
  alimentosCustom: Alimento[] = []
): Respaldo {
  return {
    version: VERSION_RESPALDO,
    sesiones,
    plantillas,
    comidas,
    perfil,
    alimentosCustom,
    ...(usuario ? { usuario } : {}),
  };
}

/**
 * Lee y valida un respaldo. Devuelve null si no hay nada aprovechable
 * (JSON inválido, versión más nueva o ninguna clave válida).
 */
export function leerRespaldo(datos: unknown): RespaldoLeido | null {
  // Formato antiguo: un array equivale a solo sesiones.
  if (Array.isArray(datos)) {
    const sesiones = datos.filter(esSesion);
    if (sesiones.length === 0) return null;
    return {
      sesiones,
      plantillas: [],
      comidas: [],
      perfil: null,
      alimentosCustom: [],
      conPlantillas: false,
      conComidas: false,
      conPerfil: false,
      conAlimentos: false,
      descartadasSesiones: datos.length - sesiones.length,
      descartadasPlantillas: 0,
      descartadasComidas: 0,
      descartadosAlimentos: 0,
    };
  }
  if (typeof datos !== "object" || datos === null) return null;
  const bruto = datos as Record<string, unknown>;
  if (typeof bruto.version !== "number" || bruto.version > VERSION_RESPALDO) {
    return null;
  }
  const conPlantillas = Array.isArray(bruto.plantillas);
  const conComidas = Array.isArray(bruto.comidas);
  const conPerfil = esPerfil(bruto.perfil);
  const conAlimentos = Array.isArray(bruto.alimentosCustom);
  const sesionesBruto = Array.isArray(bruto.sesiones) ? bruto.sesiones : [];
  const plantillasBruto = conPlantillas ? (bruto.plantillas as unknown[]) : [];
  const comidasBruto = conComidas ? (bruto.comidas as unknown[]) : [];
  const alimentosBruto = conAlimentos ? (bruto.alimentosCustom as unknown[]) : [];
  const sesiones = sesionesBruto.filter(esSesion);
  const plantillas = plantillasBruto.filter(esPlantilla);
  const comidas = comidasBruto.filter(esComida);
  const alimentosCustom = alimentosBruto.filter(esAlimento);
  const perfil = conPerfil ? (bruto.perfil as Perfil) : null;
  if (sesiones.length === 0 && plantillas.length === 0 && comidas.length === 0 && perfil === null && alimentosCustom.length === 0) return null;
  return {
    sesiones,
    plantillas,
    comidas,
    perfil,
    alimentosCustom,
    conPlantillas,
    conComidas,
    conPerfil,
    conAlimentos,
    descartadasSesiones: sesionesBruto.length - sesiones.length,
    descartadasPlantillas: plantillasBruto.length - plantillas.length,
    descartadasComidas: comidasBruto.length - comidas.length,
    descartadosAlimentos: alimentosBruto.length - alimentosCustom.length,
  };
}
