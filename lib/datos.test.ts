import { afterEach, describe, expect, it, vi } from "vitest";
import { cargarSesiones, esSesion, guardarSesiones, ordenarSesiones } from "./datos";
import type { Sesion } from "./tipos";

// Tests del almacenamiento. En Node no hay window: solo se ejerce el camino
// seguro (devolver [] / no hacer nada). Para el camino con localStorage se
// instala un stub mínimo en globalThis.

const CLAVE = "gymtrack_sesiones";

function sesion(fecha: string, creadaEn = 1): Sesion {
  return {
    id: `${fecha}-${creadaEn}`,
    fecha,
    creadaEn,
    ejercicios: [{ nombre: "Press", tandas: [{ reps: "10", peso: "60" }] }],
  };
}

function conLocalStorage(valorInicial: string | null) {
  let guardado = valorInicial;
  const stub = {
    getItem: vi.fn(() => guardado),
    setItem: vi.fn((clave: string, valor: string) => {
      expect(clave).toBe(CLAVE);
      guardado = valor;
    }),
  };
  vi.stubGlobal("localStorage", stub);
  vi.stubGlobal("window", { localStorage: stub });
  return { stub, leer: () => guardado };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("cargarSesiones", () => {
  it("devuelve [] sin window (servidor)", () => {
    expect(cargarSesiones()).toEqual([]);
  });

  it("devuelve [] si no hay nada guardado", () => {
    conLocalStorage(null);
    expect(cargarSesiones()).toEqual([]);
  });

  it("devuelve [] con JSON roto o que no es un array", () => {
    const ctx = conLocalStorage("esto no es json");
    expect(cargarSesiones()).toEqual([]);
    ctx.stub.getItem.mockImplementation(() => '{"id": 1}');
    expect(cargarSesiones()).toEqual([]);
  });

  it("filtra lo que no tiene forma de sesión y conserva lo válido", () => {
    const valida = sesion("2026-10-01");
    conLocalStorage(JSON.stringify([valida, { roto: true }, "texto", null]));
    expect(cargarSesiones()).toEqual([valida]);
  });
});

describe("guardarSesiones", () => {
  it("no falla sin window (servidor)", () => {
    expect(() => guardarSesiones([sesion("2026-10-01")])).not.toThrow();
  });

  it("guarda y recarga la lista completa", () => {
    const ctx = conLocalStorage(null);
    const lista = [sesion("2026-10-01"), sesion("2026-09-30", 2)];
    guardarSesiones(lista);
    expect(ctx.stub.setItem).toHaveBeenCalledTimes(1);
    expect(cargarSesiones()).toEqual(lista);
  });
});

describe("esSesion", () => {
  it("acepta sesiones válidas y rechaza el resto", () => {
    expect(esSesion(sesion("2026-10-01"))).toBe(true);
    expect(esSesion(null)).toBe(false);
    expect(esSesion({ id: "x" })).toBe(false);
    expect(esSesion({ ...sesion("2026-10-01"), ejercicios: "no-array" })).toBe(false);
  });

  it("acepta ejercicios con observaciones opcionales", () => {
    const conObs = sesion("2026-10-01");
    conObs.ejercicios = [
      { nombre: "Press", observaciones: "Agarre estrecho", tandas: [{ reps: "10", peso: "60" }] },
    ];
    expect(esSesion(conObs)).toBe(true);
  });
});

describe("ordenarSesiones", () => {
  it("ordena de la más reciente a la más antigua", () => {
    const vieja = sesion("2026-09-28");
    const nueva = sesion("2026-10-01");
    expect(ordenarSesiones([vieja, nueva])).toEqual([nueva, vieja]);
  });

  it("desempata el mismo día por creadaEn descendente", () => {
    const primera = sesion("2026-10-01", 1);
    const segunda = sesion("2026-10-01", 2);
    expect(ordenarSesiones([primera, segunda])).toEqual([segunda, primera]);
  });

  it("no muta el array original", () => {
    const lista = [sesion("2026-09-28"), sesion("2026-10-01")];
    ordenarSesiones(lista);
    expect(lista[0].fecha).toBe("2026-09-28");
  });
});
