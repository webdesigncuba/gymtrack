import { afterEach, describe, expect, it, vi } from "vitest";
import {
  backendLocalPerfil,
  cargarPerfil,
  esPerfil,
  guardarPerfil,
  normalizarPerfil,
  olvidarPerfil,
  PERFIL_VACIO,
} from "./perfil";

// Tests del perfil del usuario: validación y guardado local.

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

describe("esPerfil", () => {
  it("acepta el perfil vacío y valores dentro de rango", () => {
    expect(esPerfil(PERFIL_VACIO)).toBe(true);
    expect(
      esPerfil({
        edadAnos: 30,
        estaturaCm: 175,
        pesoKg: 70,
        sexo: "hombre",
        actividad: "moderado",
        objetivo: "mantener",
      })
    ).toBe(true);
  });

  it("acepta el perfil antiguo (sin sexo ni actividad)", () => {
    expect(esPerfil({ edadAnos: 30, estaturaCm: 175, pesoKg: 70 })).toBe(true);
  });

  it("rechaza lo que no es número ni null y lo fuera de rango", () => {
    expect(esPerfil(null)).toBe(false);
    expect(esPerfil({ edadAnos: "30", estaturaCm: null, pesoKg: null })).toBe(false);
    expect(esPerfil({ edadAnos: 200, estaturaCm: null, pesoKg: null })).toBe(false);
    expect(esPerfil({ edadAnos: null, estaturaCm: 10, pesoKg: null })).toBe(false);
    expect(esPerfil({ edadAnos: null, estaturaCm: null, pesoKg: 0 })).toBe(false);
    expect(esPerfil({ ...PERFIL_VACIO, sexo: "otro" })).toBe(false);
    expect(esPerfil({ ...PERFIL_VACIO, actividad: "extremo" })).toBe(false);
    expect(esPerfil({ ...PERFIL_VACIO, objetivo: "correr" })).toBe(false);
  });
});

describe("normalizarPerfil", () => {
  it("rellena con null lo que falte del perfil antiguo", () => {
    expect(
      normalizarPerfil({ edadAnos: 30, estaturaCm: null, pesoKg: null } as never)
    ).toEqual({
      edadAnos: 30,
      estaturaCm: null,
      pesoKg: null,
      sexo: null,
      actividad: null,
      objetivo: null,
    });
  });
});

describe("cargarPerfil / guardarPerfil / olvidarPerfil", () => {
  it("devuelve null sin window y sin nada guardado", () => {
    expect(cargarPerfil()).toBeNull();
    conLocalStorage(null);
    expect(cargarPerfil()).toBeNull();
  });

  it("guarda, recarga y borra el perfil", () => {
    conLocalStorage(null);
    const perfil = {
      edadAnos: 30,
      estaturaCm: 175,
      pesoKg: 70,
      sexo: "hombre",
      actividad: "moderado",
      objetivo: "mantener",
    } as const;
    guardarPerfil({ ...perfil });
    expect(cargarPerfil()).toEqual({ ...perfil });
    olvidarPerfil();
    expect(cargarPerfil()).toBeNull();
  });

  it("ignora lo inválido al leer", () => {
    conLocalStorage(JSON.stringify({ edadAnos: "viejo" }));
    expect(cargarPerfil()).toBeNull();
  });

  it("el backend local guarda y carga (null si vacío)", async () => {
    conLocalStorage(null);
    expect(await backendLocalPerfil.cargar()).toBeNull();
    const perfil = {
      edadAnos: 25,
      estaturaCm: 160,
      pesoKg: 60,
      sexo: "mujer",
      actividad: "ligero",
      objetivo: "perder",
    } as const;
    await backendLocalPerfil.guardar({ ...perfil });
    expect(await backendLocalPerfil.cargar()).toEqual({ ...perfil });
  });
});
