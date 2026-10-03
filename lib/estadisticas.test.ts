import { describe, expect, it } from "vitest";
import {
  mejorRacha,
  recordsPorEjercicio,
  tandasPorSemana,
  volumenTotal,
} from "./estadisticas";
import { moverDias, hoyISO } from "./fechas";
import type { Sesion } from "./tipos";

// Tests de estadísticas: volumen, semanas, rachas y récords.

function sesion(
  fecha: string,
  ejercicios: Sesion["ejercicios"],
  creadaEn = 1
): Sesion {
  return { id: `${fecha}-${creadaEn}`, fecha, creadaEn, ejercicios };
}

const tanda = (reps: string, peso: string) => ({ reps, peso });

describe("volumenTotal", () => {
  it("suma reps × peso solo con ambos datos numéricos", () => {
    const lista = [
      sesion("2026-09-28", [
        { nombre: "Press", tandas: [tanda("10", "60"), tanda("8", "")] },
      ]),
      sesion("2026-09-29", [
        { nombre: "Muerto", tandas: [tanda("5", "100.5"), tanda("abc", "10")] },
      ]),
    ];
    // 600 + 0 + 502.5 + 0
    expect(volumenTotal(lista)).toBe(1102.5);
  });

  it("vale 0 sin sesiones y evita el polvo de coma flotante", () => {
    expect(volumenTotal([])).toBe(0);
    const lista = [sesion("2026-09-28", [{ nombre: "X", tandas: [tanda("3", "0.1")] }])];
    expect(volumenTotal(lista)).toBe(0.3);
  });
});

describe("tandasPorSemana", () => {
  it("devuelve 8 semanas terminando en la actual", () => {
    const hoy = hoyISO();
    const lista = [
      sesion(hoy, [{ nombre: "A", tandas: [tanda("10", "50"), tanda("10", "50")] }]),
      sesion(moverDias(hoy, -10), [{ nombre: "B", tandas: [tanda("5", "20")] }]),
    ];
    const semanas = tandasPorSemana(lista);
    expect(semanas).toHaveLength(8);
    expect(semanas.reduce((n, s) => n + s.tandas, 0)).toBe(3);
    expect(semanas[7].tandas).toBe(2);
  });

  it("devuelve ceros sin sesiones", () => {
    const semanas = tandasPorSemana([]);
    expect(semanas).toHaveLength(8);
    expect(semanas.every((s) => s.tandas === 0)).toBe(true);
  });
});

describe("mejorRacha", () => {
  it("encuentra la mejor racha aunque no sea la viva", () => {
    // Racha vieja de 4 + racha viva de 2 → la mejor es 4.
    const hoy = hoyISO();
    const vieja = [30, 29, 28, 27].map((n) => moverDias(hoy, -n));
    expect(mejorRacha([...vieja, hoy, moverDias(hoy, -1)])).toBe(4);
  });

  it("vale 0 sin fechas y 1 con un solo día", () => {
    expect(mejorRacha([])).toBe(0);
    expect(mejorRacha([hoyISO()])).toBe(1);
  });
});

describe("recordsPorEjercicio", () => {
  it("se queda con el peso máximo y en empates con lo más reciente", () => {
    const lista = [
      sesion("2026-09-28", [{ nombre: "Press", tandas: [tanda("10", "60")] }]),
      sesion("2026-09-30", [
        { nombre: "PRESS", tandas: [tanda("8", "80"), tanda("8", "")] },
      ]),
      sesion("2026-10-01", [
        { nombre: "press", tandas: [tanda("8", "80")] },
        { nombre: "Curl", tandas: [tanda("10", "")] },
      ]),
    ];
    expect(recordsPorEjercicio(lista)).toEqual([
      { nombre: "press", peso: 80, fecha: "2026-10-01" },
    ]);
  });

  it("ordena de mayor a menor peso y devuelve [] sin sesiones", () => {
    const lista = [
      sesion("2026-09-28", [{ nombre: "Curl", tandas: [tanda("10", "20")] }]),
      sesion("2026-09-29", [{ nombre: "Press", tandas: [tanda("5", "100")] }]),
    ];
    const nombres = recordsPorEjercicio(lista).map((r) => r.nombre);
    expect(nombres).toEqual(["Press", "Curl"]);
    expect(recordsPorEjercicio([])).toEqual([]);
  });
});
