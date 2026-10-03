import { redondear1 } from "@/lib/alimentos";
import type { Actividad, Objetivo, Perfil } from "@/lib/tipos";

// Calorías que necesita el usuario a partir de su perfil.
// Fórmula Mifflin-St Jeor para el metabolismo basal (TMB), factor de
// actividad para el gasto diario (TDEE) y ajuste según el objetivo.
// Es una orientación, no una recomendación médica.

/** Factor de actividad para pasar del TMB al gasto diario. */
export const FACTORES_ACTIVIDAD: Record<Actividad, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
};

/** Etiquetas en español para los desplegables. */
export const ETIQUETAS_ACTIVIDAD: { id: Actividad; etiqueta: string }[] = [
  { id: "sedentario", etiqueta: "Sedentario (poco o nada)" },
  { id: "ligero", etiqueta: "Ligero (1–3 días/semana)" },
  { id: "moderado", etiqueta: "Moderado (3–5 días/semana)" },
  { id: "activo", etiqueta: "Activo (6–7 días/semana)" },
  { id: "muy_activo", etiqueta: "Muy activo (trabajo físico)" },
];

export const ETIQUETAS_OBJETIVO: { id: Objetivo; etiqueta: string }[] = [
  { id: "mantener", etiqueta: "Mantener peso" },
  { id: "perder", etiqueta: "Perder peso" },
  { id: "ganar", etiqueta: "Ganar peso" },
];

/** Ajuste de kcal sobre el mantenimiento según el objetivo. */
const AJUSTE_OBJETIVO: Record<Objetivo, number> = {
  mantener: 0,
  perder: -400,
  ganar: 250,
};

/** Resultado del cálculo: basal, gasto diario y objetivo redondeado. */
export interface CaloriasNecesarias {
  tmb: number;
  tdee: number;
  objetivo: number;
}

/**
 * Calcula las calorías diarias del perfil, o null si falta algún dato
 * (edad, estatura, peso, sexo o actividad). Sin objetivo se usa mantener.
 */
export function caloriasNecesarias(perfil: Perfil | null): CaloriasNecesarias | null {
  if (!perfil) return null;
  const { edadAnos, estaturaCm, pesoKg, sexo, actividad } = perfil;
  if (
    edadAnos === null ||
    estaturaCm === null ||
    pesoKg === null ||
    sexo === null ||
    actividad === null
  ) {
    return null;
  }
  const base = 10 * pesoKg + 6.25 * estaturaCm - 5 * edadAnos;
  const tmb = redondear1(base + (sexo === "hombre" ? 5 : -161));
  const tdee = redondear1(tmb * FACTORES_ACTIVIDAD[actividad]);
  const objetivo = Math.round((tdee + AJUSTE_OBJETIVO[perfil.objetivo ?? "mantener"]) / 10) * 10;
  return { tmb, tdee, objetivo };
}

/** Estado del día frente al objetivo: % (tope 100), lo que falta y si cubre. */
export interface EstadoCalorias {
  porcentaje: number;
  faltan: number;
  cubierto: boolean;
}

/**
 * Compara lo consumido hoy con el objetivo. `faltan` es negativo si te
 * pasaste (entonces `cubierto` es true).
 */
export function estadoCalorias(consumido: number, objetivo: number): EstadoCalorias {
  const porcentaje =
    !Number.isFinite(objetivo) || objetivo <= 0
      ? 0
      : Math.min(100, Math.max(0, Math.round((consumido / objetivo) * 100)));
  return {
    porcentaje,
    faltan: redondear1(objetivo - consumido),
    cubierto: consumido >= objetivo,
  };
}
