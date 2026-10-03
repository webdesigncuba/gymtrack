import { describe, expect, it } from "vitest";
import { diasDelMes, moverMes, tituloMes } from "./calendario";

// Tests del calendario mensual (todo en hora local, semanas desde el lunes).

describe("diasDelMes", () => {
  it("rellena semanas completas de 7 con huecos donde toca", () => {
    // Septiembre de 2026: el día 1 cae en martes → 1 hueco inicial.
    const semanas = diasDelMes(2026, 9);
    expect(semanas.every((f) => f.length === 7)).toBe(true);
    expect(semanas[0][0]).toBeNull();
    expect(semanas[0][1]).toBe("2026-09-01");
  });

  it("soporta febrero bisiesto y meses que empiezan en domingo", () => {
    const febrero = diasDelMes(2024, 2).flat().filter(Boolean);
    expect(febrero).toHaveLength(29);
    expect(febrero[28]).toBe("2024-02-29");
    // Noviembre de 2026: el día 1 cae en domingo → 6 huecos iniciales.
    const noviembre = diasDelMes(2026, 11)[0].filter((c) => c === null);
    expect(noviembre).toHaveLength(6);
  });

  it("contiene cada día del mes una sola vez", () => {
    const dias = diasDelMes(2026, 10).flat().filter(Boolean);
    expect(dias).toHaveLength(31);
    expect(new Set(dias).size).toBe(31);
  });
});

describe("moverMes", () => {
  it("cruza años en ambas direcciones", () => {
    expect(moverMes(2026, 1, -1)).toEqual({ anio: 2025, mes: 12 });
    expect(moverMes(2026, 12, 1)).toEqual({ anio: 2027, mes: 1 });
    expect(moverMes(2026, 10, 0)).toEqual({ anio: 2026, mes: 10 });
  });
});

describe("tituloMes", () => {
  it("lo escribe en español con mayúscula inicial", () => {
    expect(tituloMes(2026, 10)).toBe("Octubre de 2026");
  });
});
