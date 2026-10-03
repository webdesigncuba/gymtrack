import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cargarPlantillas,
  esPlantilla,
  guardarPlantillas,
} from "./plantillas";
import type { Plantilla } from "./plantillas";

// Tests de plantillas: validación y almacenamiento con clave propia.

function plantilla(nombre = "Pierna"): Plantilla {
  return {
    id: "p1",
    nombre,
    creadaEn: 1,
    ejercicios: [
      { nombre: "Sentadilla", tandas: 4 },
      { nombre: "Prensa", tandas: 3 },
    ],
  };
}

function conLocalStorage(valorInicial: string | null) {
  let guardado = valorInicial;
  const stub = {
    getItem: vi.fn(() => guardado),
    setItem: vi.fn((_clave: string, valor: string) => {
      guardado = valor;
    }),
  };
  vi.stubGlobal("localStorage", stub);
  vi.stubGlobal("window", { localStorage: stub });
  return { leer: () => guardado };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("esPlantilla", () => {
  it("acepta plantillas válidas y rechaza el resto", () => {
    expect(esPlantilla(plantilla())).toBe(true);
    expect(esPlantilla(null)).toBe(false);
    expect(esPlantilla({ nombre: "Sin id" })).toBe(false);
    expect(
      esPlantilla({ ...plantilla(), ejercicios: [{ nombre: "X" }] })
    ).toBe(false);
  });
});

describe("cargarPlantillas / guardarPlantillas", () => {
  it("devuelve [] sin window y sin nada guardado", () => {
    expect(cargarPlantillas()).toEqual([]);
    conLocalStorage(null);
    expect(cargarPlantillas()).toEqual([]);
  });

  it("guarda y recarga la lista completa", () => {
    conLocalStorage(null);
    const lista = [plantilla(), plantilla("Torso")];
    guardarPlantillas(lista);
    expect(cargarPlantillas()).toEqual(lista);
  });

  it("filtra lo inválido al leer", () => {
    conLocalStorage(JSON.stringify([plantilla("Torso"), { rota: true }]));
    expect(cargarPlantillas()).toEqual([plantilla("Torso")]);
  });
});
