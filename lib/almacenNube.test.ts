import { describe, expect, it, vi } from "vitest";
import { backendNubeComidas, backendNubePerfil, backendNubePlantillas } from "./almacenNube";
import { buscarAlimento, crearComida } from "./alimentos";

// Tests de plantillas en la nube con un cliente Supabase mockeado.

interface Respuesta {
  data: unknown[] | null;
  error: { message: string } | null;
}

interface RespuestaUno {
  data: unknown | null;
  error: { message: string } | null;
}

interface Llamada {
  tabla: string;
  operacion: string;
  filas?: unknown;
  /** Filtro `.not(...)` aplicado al borrado, si lo hubo. */
  not?: string | null;
}

// Crea un mock mínimo con respuestas configurables por operación.
function mockSupabase(respuestas: {
  select?: Respuesta;
  unico?: RespuestaUno;
  borrado?: { error: { message: string } | null };
  insertado?: { error: { message: string } | null };
  actualizado?: { error: { message: string } | null };
}) {
  const llamadas: Llamada[] = [];
  const cliente = {
    from: (tabla: string) => ({
      select: (..._args: unknown[]) => ({
        eq: (..._filtro: unknown[]) => {
          const promesa = (async () => {
            llamadas.push({ tabla, operacion: "select" });
            return respuestas.select ?? { data: [], error: null };
          })();
          return Object.assign(promesa, {
            maybeSingle: async () => {
              llamadas.push({ tabla, operacion: "maybeSingle" });
              return respuestas.unico ?? { data: null, error: null };
            },
          });
        },
      }),
      // El borrador real encadena `.not(...)` (si hay) y luego `.eq(...)`;
      // el mock registra ambos en una sola llamada.
      delete: () => {
        let filtroNot: string | null = null;
        const eq = async (..._filtro: unknown[]) => {
          llamadas.push({ tabla, operacion: "delete", not: filtroNot });
          return respuestas.borrado ?? { error: null };
        };
        return {
          eq,
          not: (_col: unknown, _op: unknown, valor: unknown) => {
            filtroNot = String(valor);
            return { eq };
          },
        };
      },
      insert: async (filas: unknown) => {
        llamadas.push({ tabla, operacion: "insert", filas });
        return respuestas.insertado ?? { error: null };
      },
      upsert: async (filas: unknown) => {
        llamadas.push({ tabla, operacion: "upsert", filas });
        return respuestas.actualizado ?? { error: null };
      },
    }),
  };
  // El mock solo implementa lo que usa el backend; el `as any` evita
  // tipar el cliente completo de Supabase para los tests.
  return { cliente: cliente as any, llamadas };
}

describe("backendNubePlantillas", () => {
  it("carga y filtra filas inválidas", async () => {
    const { cliente } = mockSupabase({
      select: {
        data: [
          {
            id: "p1",
            nombre: "Pierna",
            creada_en: 1,
            ejercicios: [{ nombre: "Sentadilla", tandas: 4 }],
          },
          { id: 7, nombre: "Rota" },
        ],
        error: null,
      },
    });
    const backend = backendNubePlantillas(cliente, "u1");
    expect(await backend.cargar()).toEqual([
      {
        id: "p1",
        nombre: "Pierna",
        creadaEn: 1,
        ejercicios: [{ nombre: "Sentadilla", tandas: 4 }],
      },
    ]);
  });

  it("devuelve [] si la lectura falla", async () => {
    const { cliente } = mockSupabase({
      select: { data: null, error: { message: "caído" } },
    });
    expect(await backendNubePlantillas(cliente, "u1").cargar()).toEqual([]);
  });

  it("guardar sube lo nuevo primero y luego borra lo que sobra", async () => {
    const { cliente, llamadas } = mockSupabase({});
    const backend = backendNubePlantillas(cliente, "u9");
    await backend.guardar([
      { id: "p1", nombre: "Pierna", creadaEn: 1, ejercicios: [] },
    ]);
    const operaciones = llamadas.map((l) => `${l.tabla}:${l.operacion}`);
    expect(operaciones).toEqual(["plantillas:upsert", "plantillas:delete"]);
    const subida = llamadas.find((l) => l.operacion === "upsert");
    expect(subida?.filas).toEqual([
      {
        id: "p1",
        user_id: "u9",
        nombre: "Pierna",
        creada_en: 1,
        ejercicios: [],
      },
    ]);
    // Lo que sobra se borra por diferencia de ids (nunca todas a ciegas).
    const borrado = llamadas.find((l) => l.operacion === "delete");
    expect(borrado?.not).toBe('("p1")');
  });

  it("si falla el subido no se borra nada (no pierde datos)", async () => {
    const { cliente, llamadas } = mockSupabase({
      actualizado: { error: { message: "caído" } },
    });
    await backendNubePlantillas(cliente, "u9").guardar([
      { id: "p1", nombre: "Pierna", creadaEn: 1, ejercicios: [] },
    ]);
    expect(llamadas.map((l) => l.operacion)).toEqual(["upsert"]);
  });

  it("con lista vacía solo se borra lo de la cuenta", async () => {
    const { cliente, llamadas } = mockSupabase({});
    await backendNubePlantillas(cliente, "u9").guardar([]);
    const borrado = llamadas.find((l) => l.operacion === "delete");
    expect(llamadas.map((l) => `${l.tabla}:${l.operacion}`)).toEqual([
      "plantillas:delete",
    ]);
    expect(borrado?.not).toBeNull();
  });
});

describe("backendNubeComidas", () => {
  it("carga y filtra filas inválidas", async () => {
    const valida = crearComida("2026-10-03", buscarAlimento("pan")!, 50);
    const { cliente } = mockSupabase({
      select: {
        data: [
          {
            id: valida.id,
            fecha: valida.fecha,
            nombre: valida.nombre,
            gramos: valida.gramos,
            kcal: valida.kcal,
            carbos: valida.carbos,
            proteinas: valida.proteinas,
            grasas: valida.grasas,
            creada_en: valida.creadaEn,
          },
          { id: 7, nombre: "Rota" },
        ],
        error: null,
      },
    });
    expect(await backendNubeComidas(cliente, "u1").cargar()).toEqual([valida]);
  });

  it("devuelve [] si la lectura falla", async () => {
    const { cliente } = mockSupabase({
      select: { data: null, error: { message: "caído" } },
    });
    expect(await backendNubeComidas(cliente, "u1").cargar()).toEqual([]);
  });

  it("guardar sube lo nuevo primero y luego borra lo que sobra", async () => {
    const { cliente, llamadas } = mockSupabase({});
    const comida = crearComida("2026-10-03", buscarAlimento("pan")!, 50);
    await backendNubeComidas(cliente, "u9").guardar([comida]);
    const operaciones = llamadas.map((l) => `${l.tabla}:${l.operacion}`);
    expect(operaciones).toEqual(["comidas:upsert", "comidas:delete"]);
    const subida = llamadas.find((l) => l.operacion === "upsert");
    expect(subida?.filas).toEqual([
      {
        id: comida.id,
        user_id: "u9",
        fecha: comida.fecha,
        nombre: comida.nombre,
        gramos: comida.gramos,
        kcal: comida.kcal,
        carbos: comida.carbos,
        proteinas: comida.proteinas,
        grasas: comida.grasas,
        creada_en: comida.creadaEn,
      },
    ]);
    const borrado = llamadas.find((l) => l.operacion === "delete");
    expect(borrado?.not).toBe(`("${comida.id}")`);
  });

  it("si falla el subido no se borra nada (no pierde datos)", async () => {
    const { cliente, llamadas } = mockSupabase({
      actualizado: { error: { message: "caído" } },
    });
    const comida = crearComida("2026-10-03", buscarAlimento("pan")!, 50);
    await backendNubeComidas(cliente, "u9").guardar([comida]);
    expect(llamadas.map((l) => l.operacion)).toEqual(["upsert"]);
  });
});

describe("backendNubePerfil", () => {
  it("carga el perfil y devuelve null si no hay o falla", async () => {
    const { cliente } = mockSupabase({
      unico: {
        data: {
          edad_anos: 30,
          estatura_cm: 175,
          peso_kg: 70,
          sexo: "hombre",
          actividad: "moderado",
          objetivo: "mantener",
        },
        error: null,
      },
    });
    expect(await backendNubePerfil(cliente, "u1").cargar()).toEqual({
      edadAnos: 30,
      estaturaCm: 175,
      pesoKg: 70,
      sexo: "hombre",
      actividad: "moderado",
      objetivo: "mantener",
    });
    const { cliente: vacio } = mockSupabase({
      unico: { data: null, error: null },
    });
    expect(await backendNubePerfil(vacio, "u1").cargar()).toBeNull();
    const { cliente: roto } = mockSupabase({
      unico: { data: null, error: { message: "caído" } },
    });
    expect(await backendNubePerfil(roto, "u1").cargar()).toBeNull();
  });

  it("acepta filas antiguas sin sexo ni actividad", async () => {
    const { cliente } = mockSupabase({
      unico: {
        data: { edad_anos: 30, estatura_cm: 175, peso_kg: 70 },
        error: null,
      },
    });
    expect(await backendNubePerfil(cliente, "u1").cargar()).toEqual({
      edadAnos: 30,
      estaturaCm: 175,
      pesoKg: 70,
      sexo: null,
      actividad: null,
      objetivo: null,
    });
  });

  it("guardar hace upsert con user_id", async () => {
    const { cliente, llamadas } = mockSupabase({});
    await backendNubePerfil(cliente, "u9").guardar({
      edadAnos: 30,
      estaturaCm: 175,
      pesoKg: 70,
      sexo: "hombre",
      actividad: "moderado",
      objetivo: "mantener",
    });
    const operacion = llamadas.find((l) => l.operacion === "upsert");
    expect(operacion?.tabla).toBe("perfiles");
    expect(operacion?.filas).toMatchObject({
      user_id: "u9",
      edad_anos: 30,
      estatura_cm: 175,
      peso_kg: 70,
      sexo: "hombre",
      actividad: "moderado",
      objetivo: "mantener",
    });
  });
});
