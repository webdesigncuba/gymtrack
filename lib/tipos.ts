// Tipos del dominio: el único lugar donde se definen las formas de
// sesión, ejercicio, tanda, alimento, comida y perfil. Todo lo demás los importa de aquí.

/** Una tanda con sus repeticiones y su peso en kg (texto de formulario). */
export interface Tanda {
  reps: string;
  peso: string;
}

/** Un ejercicio con su nombre y sus tandas. */
export interface Ejercicio {
  nombre: string;
  tandas: Tanda[];
  /** Variante del día en texto libre ("agarre estrecho"). Opcional para no
   * romper las sesiones ya guardadas (ausente = sin observaciones). */
  observaciones?: string;
}

/** Una sesión de entrenamiento de un día. */
export interface Sesion {
  id: string;
  /** Fecha local en formato "YYYY-MM-DD". */
  fecha: string;
  creadaEn: number;
  ejercicios: Ejercicio[];
}

/** Formato antiguo guardado antes de las tandas por ejercicio.
 * Se acepta al leer para no romper datos existentes. */
export interface EjercicioAntiguo {
  nombre?: string;
  tandas?: string;
  repeticiones?: string;
  peso?: string;
}

/** Un alimento con sus nutrientes por cada 100 g (o 100 ml). */
export interface Alimento {
  nombre: string;
  /** Kcal por 100 g. */
  kcal: number;
  /** Carbohidratos (g) por 100 g. */
  carbos: number;
  /** Proteínas (g) por 100 g. */
  proteinas: number;
  /** Grasas (g) por 100 g. */
  grasas: number;
  /** Nombres alternativos ("pao", "pão" → pan). */
  alias?: string[];
}

/** Una comida registrada un día (puede haber varias por día). */
export interface Comida {
  id: string;
  /** Fecha local en formato "YYYY-MM-DD". */
  fecha: string;
  nombre: string;
  /** Cantidad en gramos (o ml). */
  gramos: number;
  /** Valores ya calculados para esos gramos. */
  kcal: number;
  carbos: number;
  proteinas: number;
  grasas: number;
  creadaEn: number;
}

/**
 * Datos del usuario para calcular sus calorías (TMB y objetivo diario).
 * Los campos son opcionales (`null` = sin rellenar).
 */
export type Sexo = "hombre" | "mujer";
export type Actividad =
  | "sedentario"
  | "ligero"
  | "moderado"
  | "activo"
  | "muy_activo";
export type Objetivo = "mantener" | "perder" | "ganar";

export interface Perfil {
  /** Edad en años (5–120). */
  edadAnos: number | null;
  /** Estatura en cm (50–250). */
  estaturaCm: number | null;
  /** Peso en kg (20–400). */
  pesoKg: number | null;
  /** Sexo (lo exige la fórmula de TMB). */
  sexo: Sexo | null;
  /** Nivel de actividad (para pasar del TMB al gasto diario). */
  actividad: Actividad | null;
  /** Objetivo de peso (ajusta las calorías de mantenimiento). */
  objetivo: Objetivo | null;
}
