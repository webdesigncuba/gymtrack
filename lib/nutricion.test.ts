import { describe, expect, it } from "vitest";
import { caloriasNecesarias, estadoCalorias } from "./nutricion";
import type { Perfil } from "./tipos";

// Tests de las calorías necesarias (Mifflin-St Jeor + actividad + objetivo).

function perfil(cambios: Partial<Perfil> = {}): Perfil {
  return {
    edadAnos: 30,
    estaturaCm: 175,
    pesoKg: 70,
    sexo: "hombre",
    actividad: "moderado",
    objetivo: "mantener",
    ...cambios,
  };
}

describe("caloriasNecesarias", () => {
  it("calcula TMB, TDEE y objetivo para un hombre moderado", () => {
    // TMB = 10×70 + 6.25×175 − 5×30 + 5 = 1648.75
    expect(caloriasNecesarias(perfil())).toEqual({
      tmb: 1648.8,
      tdee: 2555.6,
      objetivo: 2560,
    });
  });

  it("resta 161 en mujeres en vez de sumar 5", () => {
    const resultado = caloriasNecesarias(perfil({ sexo: "mujer" }));
    // TMB = 10×70 + 6.25×175 − 5×30 − 161 = 1482.75
    expect(resultado?.tmb).toBe(1482.8);
    expect(resultado?.objetivo).toBe(2300);
  });

  it("ajusta según el objetivo (perder −400, ganar +250)", () => {
    expect(caloriasNecesarias(perfil({ objetivo: "perder" }))?.objetivo).toBe(2160);
    expect(caloriasNecesarias(perfil({ objetivo: "ganar" }))?.objetivo).toBe(2810);
    // Sin objetivo se usa mantener.
    expect(caloriasNecesarias(perfil({ objetivo: null }))?.objetivo).toBe(2560);
  });

  it("devuelve null si falta algún dato o no hay perfil", () => {
    expect(caloriasNecesarias(null)).toBeNull();
    expect(caloriasNecesarias(perfil({ sexo: null }))).toBeNull();
    expect(caloriasNecesarias(perfil({ actividad: null }))).toBeNull();
    expect(caloriasNecesarias(perfil({ pesoKg: null }))).toBeNull();
    expect(caloriasNecesarias(perfil({ edadAnos: null }))).toBeNull();
    expect(caloriasNecesarias(perfil({ estaturaCm: null }))).toBeNull();
  });
});

describe("estadoCalorias", () => {
  it("calcula el porcentaje y lo que falta", () => {
    expect(estadoCalorias(1280, 2560)).toEqual({
      porcentaje: 50,
      faltan: 1280,
      cubierto: false,
    });
  });

  it("marca cubierto al llegar y con exceso (tope 100%)", () => {
    expect(estadoCalorias(2560, 2560).cubierto).toBe(true);
    expect(estadoCalorias(3000, 2560)).toEqual({
      porcentaje: 100,
      faltan: -440,
      cubierto: true,
    });
  });

  it("con objetivo inválido devuelve 0%", () => {
    expect(estadoCalorias(500, 0)).toEqual({
      porcentaje: 0,
      faltan: -500,
      cubierto: true,
    });
  });
});
