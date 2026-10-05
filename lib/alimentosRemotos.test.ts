import { describe, expect, it } from "vitest";
import { mapearProducto } from "./alimentosRemotos";
import { esAlimento } from "./alimentosCustom";

// Tests del mapeo de Open Food Facts a alimento por 100 g (sin red).

describe("mapearProducto", () => {
  it("mapea nombre y nutrientes por 100 g", () => {
    const alimento = mapearProducto({
      product_name: "Yogur griego",
      brands: "Marca X, Otra",
      nutriments: {
        "energy-kcal_100g": 97,
        carbohydrates_100g: 3.9,
        proteins_100g: 9,
        fat_100g: 5,
      },
    });
    expect(alimento).toEqual({
      nombre: "Yogur griego",
      kcal: 97,
      carbos: 3.9,
      proteinas: 9,
      grasas: 5,
      marca: "Marca X",
    });
    expect(esAlimento(alimento)).toBe(true);
  });

  it("prefiere el nombre en español y convierte kJ a kcal", () => {
    const alimento = mapearProducto({
      product_name: "Plain yogurt",
      product_name_es: "Yogur natural",
      nutriments: {
        energy_100g: 418.4,
        carbohydrates_100g: 4,
        proteins_100g: 3,
        fat_100g: 3,
      },
    });
    expect(alimento?.nombre).toBe("Yogur natural");
    expect(alimento?.kcal).toBe(100);
  });

  it("descarta sin nombre o sin energía", () => {
    expect(mapearProducto({ nutriments: { "energy-kcal_100g": 50 } })).toBeNull();
    expect(mapearProducto({ product_name: "Agua" })).toBeNull();
    expect(
      mapearProducto({
        product_name: "Raro",
        nutriments: { "energy-kcal_100g": Number.NaN },
      })
    ).toBeNull();
  });
});
