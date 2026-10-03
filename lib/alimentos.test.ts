import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ALIMENTOS_BASE,
  backendLocalComidas,
  buscarAlimento,
  calcularNutrientes,
  cargarComidas,
  crearComida,
  esComida,
  guardarComidas,
  kcalPorDia,
  normalizarAlimento,
  ordenarComidas,
  totalesDelDia,
} from "./alimentos";

// Tests de la dieta: base local + cálculo por gramos + guardado local.

describe("normalizarAlimento", () => {
  it("ignora mayúsculas, espacios y acentos", () => {
    expect(normalizarAlimento("  Plátano ")).toBe("platano");
    expect(normalizarAlimento("PÃO")).toBe("pao");
  });
});

describe("buscarAlimento", () => {
  it("encuentra por nombre exacto sin importar mayúsculas", () => {
    expect(buscarAlimento("PAN")?.nombre).toBe("pan");
  });

  it("resuelve el alias 'pao' y 'pão' como pan", () => {
    expect(buscarAlimento("pao")?.nombre).toBe("pan");
    expect(buscarAlimento("pão")?.nombre).toBe("pan");
  });

  it("encuentra por coincidencia parcial", () => {
    expect(buscarAlimento("arro")?.nombre).toContain("arroz");
  });

  it("devuelve null si no existe o está vacío", () => {
    expect(buscarAlimento("pizza espacial")).toBeNull();
    expect(buscarAlimento("   ")).toBeNull();
  });

  it("la base trae al menos 20 alimentos", () => {
    expect(ALIMENTOS_BASE.length).toBeGreaterThanOrEqual(20);
  });
});

describe("calcularNutrientes", () => {
  const pan = buscarAlimento("pan")!;

  it("a 100 g devuelve los valores de la base", () => {
    expect(calcularNutrientes(pan, 100)).toEqual({
      kcal: 265,
      carbos: 49,
      proteinas: 9,
      grasas: 3.2,
    });
  });

  it("a 50 g devuelve la mitad", () => {
    expect(calcularNutrientes(pan, 50)).toEqual({
      kcal: 132.5,
      carbos: 24.5,
      proteinas: 4.5,
      grasas: 1.6,
    });
  });

  it("con gramos inválidos devuelve ceros", () => {
    expect(calcularNutrientes(pan, 0)).toEqual({ kcal: 0, carbos: 0, proteinas: 0, grasas: 0 });
    expect(calcularNutrientes(pan, -10)).toEqual({ kcal: 0, carbos: 0, proteinas: 0, grasas: 0 });
    expect(calcularNutrientes(pan, NaN)).toEqual({ kcal: 0, carbos: 0, proteinas: 0, grasas: 0 });
  });
});

describe("esComida", () => {
  it("acepta comidas válidas y rechaza el resto", () => {
    const valida = crearComida("2026-10-03", buscarAlimento("pan")!, 50);
    expect(esComida(valida)).toBe(true);
    expect(esComida(null)).toBe(false);
    expect(esComida({ ...valida, fecha: "ayer" })).toBe(false);
    expect(esComida({ ...valida, gramos: 0 })).toBe(false);
  });
});

describe("crearComida + totalesDelDia", () => {
  it("crearComida calcula sola los nutrientes", () => {
    const comida = crearComida("2026-10-03", buscarAlimento("pan")!, 50);
    expect(comida.nombre).toBe("pan");
    expect(comida.gramos).toBe(50);
    expect(comida.kcal).toBe(132.5);
    expect(comida.fecha).toBe("2026-10-03");
  });

  it("totalesDelDia suma solo el día pedido", () => {
    const pan = buscarAlimento("pan")!;
    const arroz = buscarAlimento("arroz")!;
    const comidas = [
      crearComida("2026-10-03", pan, 100),
      crearComida("2026-10-03", arroz, 100),
      crearComida("2026-10-02", pan, 100),
    ];
    expect(totalesDelDia(comidas, "2026-10-03")).toEqual({
      kcal: 395,
      carbos: 77,
      proteinas: 11.7,
      grasas: 3.5,
    });
    expect(totalesDelDia(comidas, "2026-10-02").kcal).toBe(265);
    expect(totalesDelDia([], "2026-10-03")).toEqual({ kcal: 0, carbos: 0, proteinas: 0, grasas: 0 });
  });
});

function conLocalStorage(valorInicial: string | null) {
  let guardado = valorInicial;
  const stub = {
    getItem: vi.fn(() => guardado),
    setItem: vi.fn((_clave: string, valor: string) => {
      guardado = valor;
    }),
    removeItem: vi.fn(() => {
      guardado = null;
    }),
  };
  vi.stubGlobal("localStorage", stub);
  vi.stubGlobal("window", { localStorage: stub });
  return { leer: () => guardado };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ordenarComidas", () => {
  it("ordena de la más reciente a la más antigua", () => {
    const pan = buscarAlimento("pan")!;
    const vieja = { ...crearComida("2026-10-01", pan, 50), creadaEn: 1 };
    const nueva = { ...crearComida("2026-10-03", pan, 50), creadaEn: 2 };
    expect(ordenarComidas([vieja, nueva])[0].fecha).toBe("2026-10-03");
  });
});

describe("cargarComidas / guardarComidas", () => {
  it("devuelve [] sin window y sin nada guardado", () => {
    expect(cargarComidas()).toEqual([]);
    conLocalStorage(null);
    expect(cargarComidas()).toEqual([]);
  });

  it("guarda y recarga la lista completa y filtra lo inválido", () => {
    conLocalStorage(null);
    const pan = buscarAlimento("pan")!;
    const lista = [crearComida("2026-10-03", pan, 50)];
    guardarComidas(lista);
    expect(cargarComidas()).toEqual(lista);
    conLocalStorage(JSON.stringify([...lista, { roto: true }]));
    expect(cargarComidas()).toEqual(lista);
  });

  it("el backend local guarda y carga", async () => {
    conLocalStorage(null);
    const pan = buscarAlimento("pan")!;
    const lista = [crearComida("2026-10-03", pan, 50)];
    await backendLocalComidas.guardar(lista);
    expect(await backendLocalComidas.cargar()).toEqual(lista);
  });
});

describe("kcalPorDia", () => {
  it("devuelve los últimos 7 días terminando hoy, con ceros si faltan", async () => {
    const { hoyISO, moverDias } = await import("./fechas");
    const hoy = hoyISO();
    const ayer = moverDias(hoy, -1);
    const pan = buscarAlimento("pan")!;
    const comidas = [crearComida(hoy, pan, 100), crearComida(ayer, pan, 50)];
    const dias = kcalPorDia(comidas, 7);
    expect(dias).toHaveLength(7);
    expect(dias[6].fecha).toBe(hoy);
    expect(dias[6].kcal).toBe(265);
    expect(dias[5].fecha).toBe(ayer);
    expect(dias[5].kcal).toBe(132.5);
    expect(dias[0].kcal).toBe(0);
  });
});
