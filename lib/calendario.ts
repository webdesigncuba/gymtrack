// Calendario mensual para el mapa de calor de entrenos.
// Todo con fecha local; las semanas empiezan en lunes.

/** Una celda del calendario: fecha "YYYY-MM-DD" o hueco. */
export type Celda = string | null;

/** Mes y año actuales según la hora local. */
export function mesActual(): { anio: number; mes: number } {
  const hoy = new Date();
  return { anio: hoy.getFullYear(), mes: hoy.getMonth() + 1 };
}

/** Mueve un mes/año N meses (negativo hacia atrás). */
export function moverMes(
  anio: number,
  mes: number,
  delta: number
): { anio: number; mes: number } {
  const total = anio * 12 + (mes - 1) + delta;
  return { anio: Math.floor(total / 12), mes: (total % 12) + 1 };
}

/** Título del mes en español, por ejemplo "Octubre de 2026". */
export function tituloMes(anio: number, mes: number): string {
  const texto = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(new Date(anio, mes - 1, 1));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Semanas de un mes (mes de 1 a 12) como filas de 7 celdas de lunes
 * a domingo, con huecos (null) antes del día 1 y después del último.
 */
export function diasDelMes(anio: number, mes: number): Celda[][] {
  const huecosIniciales = (new Date(anio, mes - 1, 1).getDay() + 6) % 7;
  const diasEnMes = new Date(anio, mes, 0).getDate();
  const celdas: Celda[] = [];
  for (let i = 0; i < huecosIniciales; i++) celdas.push(null);
  for (let dia = 1; dia <= diasEnMes; dia++) {
    celdas.push(
      `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
    );
  }
  while (celdas.length % 7 !== 0) celdas.push(null);
  const semanas: Celda[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}
