import { describe, expect, it } from "vitest";
import {
  aISO,
  calcularRacha,
  formatearFecha,
  hoyISO,
  moverDias,
} from "./fechas";

// Tests de las utilidades de fecha. Todo en hora local, nunca UTC.

describe("hoyISO / aISO", () => {
  it("devuelve hoy en formato YYYY-MM-DD con la hora local", () => {
    const ahora = new Date();
    const esperado = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(
      ahora.getDate()
    ).padStart(2, "0")}`;
    expect(hoyISO()).toBe(esperado);
  });

  it("convierte un Date usando sus componentes locales", () => {
    // 5 de enero de 2026, 12:00 local (lejos de medianoche para evitar
    // que cualquier conversión a UTC cambie el día).
    expect(aISO(new Date(2026, 0, 5, 12))).toBe("2026-01-05");
  });
});

describe("moverDias", () => {
  it("suma y resta días", () => {
    expect(moverDias("2026-10-01", 1)).toBe("2026-10-02");
    expect(moverDias("2026-10-01", -1)).toBe("2026-09-30");
  });

  it("cruza meses, años y el 29 de febrero bisiesto", () => {
    expect(moverDias("2026-01-01", -1)).toBe("2025-12-31");
    expect(moverDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(moverDias("2024-02-28", 1)).toBe("2024-02-29");
    expect(moverDias("2024-02-29", 1)).toBe("2024-03-01");
  });
});

describe("formatearFecha", () => {
  it("muestra la fecha en español", () => {
    const texto = formatearFecha("2026-10-01");
    expect(texto).toContain("2026");
    expect(texto.toLowerCase()).toContain("oct");
  });
});

describe("calcularRacha", () => {
  const hoy = hoyISO();
  const ayer = moverDias(hoy, -1);
  const anteayer = moverDias(hoy, -2);

  it("vale 0 sin sesiones", () => {
    expect(calcularRacha([])).toBe(0);
  });

  it("vale 1 con solo la sesión de hoy", () => {
    expect(calcularRacha([hoy])).toBe(1);
  });

  it("cuenta los días consecutivos", () => {
    expect(calcularRacha([hoy, ayer, anteayer])).toBe(3);
  });

  it("sigue viva si hoy falta pero ayer sí hubo sesión", () => {
    expect(calcularRacha([ayer, anteayer])).toBe(2);
  });

  it("se rompe con un hueco (ni hoy ni ayer)", () => {
    expect(calcularRacha([anteayer])).toBe(0);
    expect(calcularRacha([hoy, anteayer])).toBe(1);
  });

  it("ignora sesiones futuras y duplicadas del mismo día", () => {
    expect(calcularRacha([moverDias(hoy, 5), hoy, hoy, ayer])).toBe(2);
  });
});
