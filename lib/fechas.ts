// Utilidades de fechas.
// Regla de oro: usamos SIEMPRE la fecha local del navegador (año, mes, día),
// nunca los métodos UTC de JavaScript.

/** Devuelve la fecha de hoy en formato "YYYY-MM-DD" usando la hora local. */
export function hoyISO(): string {
  return aISO(new Date());
}

/** Convierte un objeto Date a "YYYY-MM-DD" usando sus componentes locales. */
export function aISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

/** Suma (o resta) días a una fecha en formato "YYYY-MM-DD". Devuelve "YYYY-MM-DD". */
export function moverDias(iso: string, dias: number): string {
  const [anio, mes, dia] = iso.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia); // mes en JS va de 0 a 11
  fecha.setDate(fecha.getDate() + dias);
  return aISO(fecha);
}

/** Formatea "YYYY-MM-DD" en español, por ejemplo: "mié, 1 oct 2026". */
export function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(fecha);
}

/**
 * Calcula la racha de días consecutivos con sesión que termina hoy.
 *
 * Reglas:
 * - Un día cuenta si tiene al menos una sesión.
 * - Si hoy todavía no hay sesión pero sí la de ayer, la racha sigue viva
 *   (no se rompe hasta que termine el día).
 */
export function calcularRacha(fechas: string[]): number {
  const conSesion = new Set(fechas);
  const hoy = hoyISO();

  // Si hoy no hay sesión, miramos si ayer la hubo para mantener la racha viva.
  const ultimoDia = conSesion.has(hoy) ? hoy : moverDias(hoy, -1);
  if (!conSesion.has(ultimoDia)) return 0;

  let racha = 0;
  let dia = ultimoDia;
  while (conSesion.has(dia)) {
    racha += 1;
    dia = moverDias(dia, -1);
  }
  return racha;
}
