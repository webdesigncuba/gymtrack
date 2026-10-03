import { afterEach, describe, expect, it, vi } from "vitest";
import { limpiarCacheLocal } from "./almacen";

// Tests del borrado de la caché local (al cerrar sesión).

function conLocalStorage(valores: Record<string, string>) {
  const guardado = { ...valores };
  const stub = {
    getItem: vi.fn((clave: string) => guardado[clave] ?? null),
    setItem: vi.fn((clave: string, valor: string) => {
      guardado[clave] = valor;
    }),
    removeItem: vi.fn((clave: string) => {
      delete guardado[clave];
    }),
  };
  vi.stubGlobal("localStorage", stub);
  vi.stubGlobal("window", { localStorage: stub });
  return { stub, leer: (clave: string) => guardado[clave] ?? null };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("limpiarCacheLocal", () => {
  it("no falla sin window (servidor)", () => {
    expect(() => limpiarCacheLocal()).not.toThrow();
  });

  it("borra sesiones, plantillas, comidas y perfil pero deja el resto", () => {
    const ctx = conLocalStorage({
      gymtrack_sesiones: "[]",
      gymtrack_plantillas: "[]",
      gymtrack_comidas: "[]",
      gymtrack_perfil: "{}",
      otra_clave: "se queda",
    });
    limpiarCacheLocal();
    expect(ctx.leer("gymtrack_sesiones")).toBeNull();
    expect(ctx.leer("gymtrack_plantillas")).toBeNull();
    expect(ctx.leer("gymtrack_comidas")).toBeNull();
    expect(ctx.leer("gymtrack_perfil")).toBeNull();
    expect(ctx.leer("otra_clave")).toBe("se queda");
    expect(ctx.stub.removeItem).toHaveBeenCalledTimes(4);
  });
});
