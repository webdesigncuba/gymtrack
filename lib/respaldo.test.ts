import { describe, expect, it } from "vitest";
import {
  VERSION_RESPALDO,
  construirRespaldo,
  leerRespaldo,
} from "./respaldo";
import { buscarAlimento, crearComida } from "./alimentos";
import type { Sesion } from "./tipos";
import type { Plantilla } from "./plantillas";

// Tests del respaldo versionado por clave (v3 con comidas y perfil).

function sesion(fecha: string): Sesion {
  return {
    id: fecha,
    fecha,
    creadaEn: 1,
    ejercicios: [{ nombre: "Press", tandas: [{ reps: "10", peso: "60" }] }],
  };
}

function plantilla(nombre = "Pierna"): Plantilla {
  return {
    id: "p1",
    nombre,
    creadaEn: 1,
    ejercicios: [{ nombre: "Sentadilla", tandas: 4 }],
  };
}

describe("construirRespaldo / leerRespaldo", () => {
  it("incluye el dueño si se indica y lo ignora al leer", () => {
    const archivo = construirRespaldo([sesion("2026-10-01")], [], "yo@ gym.com");
    expect(archivo.usuario).toBe("yo@ gym.com");
    const leido = leerRespaldo(archivo);
    expect(leido?.sesiones).toHaveLength(1);
    expect(construirRespaldo([], []).usuario).toBeUndefined();
  });

  it("redondea sesiones, plantillas, comidas y perfil con la versión actual", () => {
    const comida = crearComida("2026-10-01", buscarAlimento("pan")!, 50);
    const perfil = {
      edadAnos: 30,
      estaturaCm: 175,
      pesoKg: 70,
      sexo: "hombre",
      actividad: "moderado",
      objetivo: "mantener",
    } as const;
    const archivo = construirRespaldo([sesion("2026-10-01")], [plantilla()], null, [comida], perfil);
    expect(archivo.version).toBe(VERSION_RESPALDO);
    expect(leerRespaldo(archivo)).toEqual({
      sesiones: [sesion("2026-10-01")],
      plantillas: [plantilla()],
      comidas: [comida],
      perfil,
      alimentosCustom: [],
      conPlantillas: true,
      conComidas: true,
      conPerfil: true,
      conAlimentos: true,
      descartadasSesiones: 0,
      descartadasPlantillas: 0,
      descartadasComidas: 0,
      descartadosAlimentos: 0,
    });
  });

  it("acepta el formato antiguo (array) como solo sesiones", () => {
    const leido = leerRespaldo([sesion("2026-10-01"), { roto: true }]);
    expect(leido?.sesiones).toHaveLength(1);
    expect(leido?.conPlantillas).toBe(false);
    expect(leido?.conComidas).toBe(false);
    expect(leido?.descartadasSesiones).toBe(1);
  });

  it("acepta la v1 (sin comidas ni perfil) sin tocar dieta ni perfil", () => {
    const leido = leerRespaldo({
      version: 1,
      sesiones: [sesion("2026-10-01")],
      plantillas: [plantilla()],
    });
    expect(leido?.sesiones).toHaveLength(1);
    expect(leido?.comidas).toEqual([]);
    expect(leido?.conComidas).toBe(false);
    expect(leido?.perfil).toBeNull();
    expect(leido?.conPerfil).toBe(false);
  });

  it("acepta la v2 (sin perfil) sin tocar el perfil", () => {
    const comida = crearComida("2026-10-01", buscarAlimento("pan")!, 50);
    const leido = leerRespaldo({
      version: 2,
      sesiones: [sesion("2026-10-01")],
      plantillas: [plantilla()],
      comidas: [comida],
    });
    expect(leido?.comidas).toEqual([comida]);
    expect(leido?.conComidas).toBe(true);
    expect(leido?.perfil).toBeNull();
    expect(leido?.conPerfil).toBe(false);
    expect(leido?.alimentosCustom).toEqual([]);
    expect(leido?.conAlimentos).toBe(false);
  });

  it("acepta la v3 (sin alimentos) sin tocar mis alimentos", () => {
    const comida = crearComida("2026-10-01", buscarAlimento("pan")!, 50);
    const leido = leerRespaldo({
      version: 3,
      sesiones: [sesion("2026-10-01")],
      plantillas: [plantilla()],
      comidas: [comida],
      perfil: null,
    });
    expect(leido?.sesiones).toHaveLength(1);
    expect(leido?.alimentosCustom).toEqual([]);
    expect(leido?.conAlimentos).toBe(false);
  });

  it("lee los alimentos personalizados de la v4", () => {
    const leido = leerRespaldo({
      version: 4,
      sesiones: [sesion("2026-10-01")],
      plantillas: [],
      comidas: [],
      perfil: null,
      alimentosCustom: [
        { nombre: "Pan de pueblo", kcal: 260, carbos: 50, proteinas: 8, grasas: 3 },
        { nombre: "", kcal: 1, carbos: 1, proteinas: 1, grasas: 1 },
      ],
    });
    expect(leido?.alimentosCustom).toHaveLength(1);
    expect(leido?.conAlimentos).toBe(true);
    expect(leido?.descartadosAlimentos).toBe(1);
  });

  it("un perfil inválido no bloquea el resto", () => {
    const leido = leerRespaldo({
      version: 3,
      sesiones: [sesion("2026-10-01")],
      plantillas: [],
      comidas: [],
      perfil: { edadAnos: "viejo" },
    });
    expect(leido?.sesiones).toHaveLength(1);
    expect(leido?.perfil).toBeNull();
    expect(leido?.conPerfil).toBe(false);
  });

  it("una clave inválida no bloquea la otra", () => {
    const leido = leerRespaldo({
      version: 1,
      sesiones: ["basura"],
      plantillas: [plantilla()],
      comidas: ["basura"],
    });
    expect(leido?.sesiones).toEqual([]);
    expect(leido?.plantillas).toEqual([plantilla()]);
    expect(leido?.comidas).toEqual([]);
    expect(leido?.descartadasSesiones).toBe(1);
    expect(leido?.descartadasComidas).toBe(1);
  });

  it("rechaza lo inservible y versiones más nuevas", () => {
    expect(leerRespaldo(null)).toBeNull();
    expect(leerRespaldo("texto")).toBeNull();
    expect(leerRespaldo({ version: 1, sesiones: [], plantillas: [] })).toBeNull();
    expect(leerRespaldo({ version: 2, sesiones: [], plantillas: [], comidas: [] })).toBeNull();
    expect(leerRespaldo({ version: 3, sesiones: [], plantillas: [], comidas: [], perfil: null })).toBeNull();
    expect(
      leerRespaldo({ version: 4, sesiones: [], plantillas: [], comidas: [], perfil: null, alimentosCustom: [] })
    ).toBeNull();
    expect(
      leerRespaldo({ version: VERSION_RESPALDO + 1, sesiones: [], plantillas: [] })
    ).toBeNull();
  });
});
