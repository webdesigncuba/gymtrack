import { describe, expect, it } from "vitest";
import { esAlimento } from "./alimentosCustom";

// Tests del guard de alimentos personalizados ("mis alimentos").

describe("esAlimento", () => {
  it("acepta un alimento válido con y sin alias", () => {
    expect(
      esAlimento({ nombre: "Pan de pueblo", kcal: 260, carbos: 50, proteinas: 8, grasas: 3 })
    ).toBe(true);
    expect(
      esAlimento({
        nombre: "Pan",
        kcal: 265,
        carbos: 49,
        proteinas: 9,
        grasas: 3.2,
        alias: ["pao"],
      })
    ).toBe(true);
  });

  it("rechaza nombre vacío, números inválidos o alias rotos", () => {
    expect(esAlimento(null)).toBe(false);
    expect(esAlimento({ nombre: "", kcal: 1, carbos: 1, proteinas: 1, grasas: 1 })).toBe(false);
    expect(esAlimento({ nombre: "X", kcal: -1, carbos: 0, proteinas: 0, grasas: 0 })).toBe(false);
    expect(
      esAlimento({ nombre: "X", kcal: 1, carbos: 1, proteinas: 1, grasas: 1, alias: [1] })
    ).toBe(false);
  });
});
