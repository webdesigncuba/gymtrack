import { describe, expect, it } from "vitest";
import { formatearTandas, normalizarNombre, ultimoUso } from "./historial";
import type { Sesion } from "./tipos";

// Tests del historial por ejercicio.

function sesion(fecha: string, nombre: string, tandas: Sesion["ejercicios"][number]["tandas"], id = fecha): Sesion {
  return { id, fecha, creadaEn: 1, ejercicios: [{ nombre, tandas }] };
}

const tanda = (reps: string, peso: string) => ({ reps, peso });

describe("normalizarNombre", () => {
  it("ignora mayúsculas y espacios de más", () => {
    expect(normalizarNombre("  Press DE banca ")).toBe("press de banca");
  });
});

describe("ultimoUso", () => {
  const sesiones = [
    sesion("2026-09-28", "Press de banca", [tanda("10", "60")], "a"),
    sesion("2026-09-30", "Sentadilla", [tanda("12", "80")], "b"),
  ];

  it("encuentra el uso más reciente sin importar mayúsculas", () => {
    expect(ultimoUso(sesiones, "  PRESS de BANCA ")?.fecha).toBe("2026-09-28");
  });

  it("devuelve null si es nuevo o el nombre está vacío", () => {
    expect(ultimoUso(sesiones, "Curl")).toBeNull();
    expect(ultimoUso(sesiones, "   ")).toBeNull();
    expect(ultimoUso([], "Press")).toBeNull();
  });

  it("excluye la sesión en edición para mostrar el uso anterior", () => {
    expect(ultimoUso(sesiones, "press de banca", "a")).toBeNull();
    expect(ultimoUso(sesiones, "press de banca", "otra")?.fecha).toBe("2026-09-28");
  });
});

describe("formatearTandas", () => {
  it("resume en formato corto y marca lo vacío con —", () => {
    expect(formatearTandas([tanda("10", "60"), tanda("", "")])).toBe(
      "10×60 kg · —×—"
    );
  });
});
