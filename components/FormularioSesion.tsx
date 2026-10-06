"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { hoyISO, formatearFecha } from "@/lib/fechas";
import { ultimoUso, formatearTandas } from "@/lib/historial";
import {
  BOTON_PELIGRO_MINI,
  BOTON_PELIGRO_SM,
  BOTON_PELIGRO_TANDA,
  BOTON_PRINCIPAL,
  BOTON_SECUNDARIO,
  BOTON_SECUNDARIO_SM,
  CAMPO_ENTRADA,
  ERROR,
  ETIQUETA,
  PISTA,
  SUBTITULO,
  TARJETA,
  TITULO,
} from "@/lib/estilos";
import {
  backendLocalPlantillas,
  type BackendPlantillas,
  type Plantilla,
} from "@/lib/plantillas";
import type { Ejercicio, EjercicioAntiguo, Sesion } from "@/lib/tipos";

// Fila editable de una tanda (con id propio para React).
interface TandaEditable {
  id: string;
  reps: string;
  peso: string;
}

// Fila editable de un ejercicio (con id propio para React).
interface EjercicioEditable {
  id: string;
  nombre: string;
  observaciones: string;
  tandas: TandaEditable[];
}

interface Props {
  onGuardar: (sesion: Sesion) => void;
  fechasOcupadas?: string[];
  sesionEnEdicion?: Sesion | null;
  sesiones?: Sesion[];
  senalPlantillas?: number;
  backendPlantillas?: BackendPlantillas;
  onCancelar?: () => void;
  onAñadirTanda?: () => void;
}

// Fila del mini-formulario para crear una plantilla desde cero.
interface FilaPlantilla {
  id: string;
  nombre: string;
  tandas: string;
}

// Fila vacía para un ejercicio nuevo de la plantilla.
function filaPlantillaVacia(): FilaPlantilla {
  return {
    id: Math.random().toString(36).slice(2),
    nombre: "",
    tandas: "",
  };
}

// Crea una tanda vacía (reps + peso).
function tandaVacia(): TandaEditable {
  return {
    id: Math.random().toString(36).slice(2),
    reps: "",
    peso: "",
  };
}

// Fila vacía para un ejercicio nuevo, con su primera tanda.
function ejercicioVacio(): EjercicioEditable {
  return {
    id: Math.random().toString(36).slice(2),
    nombre: "",
    observaciones: "",
    tandas: [tandaVacia()],
  };
}

// Convierte un ejercicio guardado en fila editable.
// Acepta el formato nuevo (tandas: [{reps, peso}]) y el formato
// antiguo (tandas: "3", repeticiones: "10", peso: "60").
// Las observaciones son opcionales: lo antiguo no las trae.
function aFilaEditable(ejercicio: Ejercicio | EjercicioAntiguo): EjercicioEditable {
  // Formato nuevo: tandas ya es un array.
  if (
    "tandas" in ejercicio &&
    Array.isArray(ejercicio.tandas) &&
    ejercicio.tandas.length > 0
  ) {
    return {
      id: Math.random().toString(36).slice(2),
      nombre: ejercicio.nombre ?? "",
      observaciones:
        "observaciones" in ejercicio && typeof ejercicio.observaciones === "string"
          ? ejercicio.observaciones
          : "",
      tandas: ejercicio.tandas.map((t) => ({
        id: Math.random().toString(36).slice(2),
        reps: t.reps ?? "",
        peso: t.peso ?? "",
      })),
    };
  }
  // Formato antiguo: repetimos sus reps/peso tantas veces como tandas decía.
  const bruto =
    typeof ejercicio.tandas === "string" ? ejercicio.tandas : "";
  const cuantas = Math.max(1, parseInt(bruto, 10) || 1);
  const repeticiones =
    "repeticiones" in ejercicio ? (ejercicio.repeticiones ?? "") : "";
  const peso = "peso" in ejercicio ? (ejercicio.peso ?? "") : "";
  return {
    id: Math.random().toString(36).slice(2),
    nombre: ejercicio.nombre ?? "",
    observaciones: "",
    tandas: Array.from({ length: cuantas }, () => ({
      id: Math.random().toString(36).slice(2),
      reps: repeticiones,
      peso,
    })),
  };
}

/**
 * Formulario para registrar o editar una sesión de entrenamiento.
 * - Si `sesionEnEdicion` es null, registra una sesión nueva.
 * - Si tiene una sesión, rellena el formulario y al guardar mantiene su id.
 * Cada ejercicio tiene sus propias tandas, cada una con reps y peso.
 * Solo se permite una sesión por día.
 */
export default function FormularioSesion({
  onGuardar,
  fechasOcupadas = [],
  sesionEnEdicion = null,
  sesiones = [],
  senalPlantillas: senalExterna = 0,
  backendPlantillas = backendLocalPlantillas,
  onCancelar,
  onAñadirTanda,
}: Props) {
  const [fecha, setFecha] = useState(hoyISO());
  const [ejercicios, setEjercicios] = useState<EjercicioEditable[]>([ejercicioVacio()]);
  const [error, setError] = useState("");
  // Aviso flotante (toast) para errores que no se deben pasar por alto.
  const [toast, setToast] = useState("");
  const toastTemporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Plantillas creadas por el usuario + la seleccionada en el desplegable.
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [plantillaId, setPlantillaId] = useState("");
  // Mini-formulario para crear una plantilla desde cero.
  const [nombreNueva, setNombreNueva] = useState("");
  const [filasNuevas, setFilasNuevas] = useState<FilaPlantilla[]>([filaPlantillaVacia()]);

  function mostrarToast(mensaje: string): void {
    setToast(mensaje);
    // Si ya había un aviso visible, reiniciamos su temporizador.
    if (toastTemporizador.current) clearTimeout(toastTemporizador.current);
    toastTemporizador.current = setTimeout(() => setToast(""), 3500);
  }

  // Limpiamos el temporizador si el formulario desaparece.
  useEffect(() => {
    return () => {
      if (toastTemporizador.current) clearTimeout(toastTemporizador.current);
    };
  }, []);

  // Cargamos las plantillas al montar, al cambiar de fuente y cuando el
  // respaldo restaura unas nuevas.
  useEffect(() => {
    let vivo = true;
    backendPlantillas
      .cargar()
      .then((guardadas) => {
        if (vivo) setPlantillas(guardadas);
      })
      .catch((error) => {
        console.warn("No se pudieron cargar las plantillas:", error);
      });
    return () => {
      vivo = false;
    };
  }, [senalExterna, backendPlantillas]);

  // Cuando empezamos a editar (o la cancelamos), cargamos los datos
  // de la sesión en el formulario, o lo dejamos limpio para una nueva.
  useEffect(() => {
    if (sesionEnEdicion) {
      setFecha(sesionEnEdicion.fecha);
      setEjercicios(sesionEnEdicion.ejercicios.map(aFilaEditable));
      setError("");
    } else {
      setFecha(hoyISO());
      setEjercicios([ejercicioVacio()]);
      setError("");
    }
  }, [sesionEnEdicion]);

  function cambiarNombreEjercicio(id: string, valor: string): void {
    setEjercicios((prev) =>
      prev.map((e) => (e.id === id ? { ...e, nombre: valor } : e))
    );
  }

  function cambiarObservaciones(id: string, valor: string): void {
    setEjercicios((prev) =>
      prev.map((e) => (e.id === id ? { ...e, observaciones: valor } : e))
    );
  }

  function cambiarTanda(
    ejercicioId: string,
    tandaId: string,
    campo: "reps" | "peso",
    valor: string
  ): void {
    setEjercicios((prev) =>
      prev.map((e) =>
        e.id !== ejercicioId
          ? e
          : {
              ...e,
              tandas: e.tandas.map((t) =>
                t.id === tandaId ? { ...t, [campo]: valor } : t
              ),
            }
      )
    );
  }

  function añadirEjercicio(): void {
    setEjercicios((prev) => [...prev, ejercicioVacio()]);
  }

  function quitarEjercicio(id: string): void {
    setEjercicios((prev) =>
      prev.length > 1 ? prev.filter((e) => e.id !== id) : [ejercicioVacio()]
    );
  }

  function añadirTanda(ejercicioId: string): void {
    setEjercicios((prev) =>
      prev.map((e) =>
        e.id === ejercicioId ? { ...e, tandas: [...e.tandas, tandaVacia()] } : e
      )
    );
    // Cada tanda nueva activa el cronómetro de descanso.
    onAñadirTanda?.();
  }

  function quitarTanda(ejercicioId: string, tandaId: string): void {
    setEjercicios((prev) =>
      prev.map((e) =>
        e.id !== ejercicioId
          ? e
          : {
              ...e,
              tandas:
                e.tandas.length > 1
                  ? e.tandas.filter((t) => t.id !== tandaId)
                  : [tandaVacia()],
            }
      )
    );
  }

  // Marca una tanda como hecha: no cambia los datos, solo arranca
  // el cronómetro de descanso. Sirve para las tandas que vienen
  // de una plantilla, donde no se pulsa "+ Añadir tanda".
  function marcarTandaHecha(): void {
    onAñadirTanda?.();
  }

  // El formulario está vacío si solo tiene una fila sin nombre.
  function formularioVacio(): boolean {
    return ejercicios.length === 1 && ejercicios[0].nombre.trim() === "";
  }

  // Expande una plantilla en filas editables con sus tandas vacías.
  // Las plantillas no guardan observaciones (son del día): empiezan vacías.
  function expandirPlantilla(plantilla: Plantilla): EjercicioEditable[] {
    return plantilla.ejercicios.map((e) => ({
      id: Math.random().toString(36).slice(2),
      nombre: e.nombre,
      observaciones: "",
      tandas: Array.from({ length: Math.max(1, e.tandas) }, () => tandaVacia()),
    }));
  }

  function aplicarPlantilla(): void {
    const plantilla = plantillas.find((p) => p.id === plantillaId);
    if (!plantilla) {
      const mensaje = "Elige una plantilla para usarla.";
      setError(mensaje);
      mostrarToast(mensaje);
      return;
    }
    // Si ya escribiste algo, pedimos confirmación antes de reemplazarlo.
    if (!formularioVacio()) {
      if (!window.confirm(`¿Reemplazar lo escrito por la plantilla "${plantilla.nombre}"?`)) return;
    }
    setEjercicios(expandirPlantilla(plantilla));
    setError("");
  }

  async function guardarComoPlantilla(): Promise<void> {
    const conNombre = ejercicios.filter((e) => e.nombre.trim() !== "");
    if (conNombre.length === 0) {
      const mensaje = "Escribe al menos un ejercicio para guardar la plantilla.";
      setError(mensaje);
      mostrarToast(mensaje);
      return;
    }
    const nombre = window.prompt("Nombre de la plantilla:");
    if (nombre === null) return; // Canceló el diálogo.
    if (nombre.trim() === "") {
      const mensaje = "La plantilla necesita un nombre.";
      setError(mensaje);
      mostrarToast(mensaje);
      return;
    }
    const nueva: Plantilla = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      nombre: nombre.trim(),
      creadaEn: Date.now(),
      ejercicios: conNombre.map((e) => ({
        nombre: e.nombre.trim(),
        tandas: e.tandas.length,
      })),
    };
    const actualizadas = [...plantillas, nueva];
    await backendPlantillas.guardar(actualizadas).catch((error) => {
      console.warn("No se pudo guardar la plantilla:", error);
    });
    setPlantillas(actualizadas);
    setPlantillaId(nueva.id);
    setNombreNueva("");
    setFilasNuevas([filaPlantillaVacia()]);
    setError("");
  }

  async function eliminarPlantilla(): Promise<void> {
    const plantilla = plantillas.find((p) => p.id === plantillaId);
    if (!plantilla) return;
    if (!window.confirm(`¿Eliminar la plantilla "${plantilla.nombre}"?`)) return;
    const actualizadas = plantillas.filter((p) => p.id !== plantilla.id);
    await backendPlantillas.guardar(actualizadas).catch((error) => {
      console.warn("No se pudo eliminar la plantilla:", error);
    });
    setPlantillas(actualizadas);
    setPlantillaId("");
    setError("");
  }

  function cambiarFilaPlantilla(
    id: string,
    campo: "nombre" | "tandas",
    valor: string
  ): void {
    setFilasNuevas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [campo]: valor } : f))
    );
  }

  function añadirFilaPlantilla(): void {
    setFilasNuevas((prev) => [...prev, filaPlantillaVacia()]);
  }

  function quitarFilaPlantilla(id: string): void {
    setFilasNuevas((prev) =>
      prev.length > 1 ? prev.filter((f) => f.id !== id) : [filaPlantillaVacia()]
    );
  }

  async function crearPlantilla(): Promise<void> {
    if (nombreNueva.trim() === "") {
      const mensaje = "La nueva plantilla necesita un nombre.";
      setError(mensaje);
      mostrarToast(mensaje);
      return;
    }
    const conNombre = filasNuevas.filter((f) => f.nombre.trim() !== "");
    if (conNombre.length === 0) {
      const mensaje = "Añade al menos un ejercicio a la plantilla.";
      setError(mensaje);
      mostrarToast(mensaje);
      return;
    }
    const sinTandas = conNombre.find(
      (f) => !(parseInt(f.tandas, 10) >= 1)
    );
    if (sinTandas) {
      const mensaje = `"${sinTandas.nombre.trim()}" necesita al menos 1 tanda.`;
      setError(mensaje);
      mostrarToast(mensaje);
      return;
    }
    const nueva: Plantilla = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      nombre: nombreNueva.trim(),
      creadaEn: Date.now(),
      ejercicios: conNombre.map((f) => ({
        nombre: f.nombre.trim(),
        tandas: parseInt(f.tandas, 10),
      })),
    };
    const actualizadas = [...plantillas, nueva];
    await backendPlantillas.guardar(actualizadas).catch((error) => {
      console.warn("No se pudo crear la plantilla:", error);
    });
    setPlantillas(actualizadas);
    setPlantillaId(nueva.id);
    setNombreNueva("");
    setFilasNuevas([filaPlantillaVacia()]);
    setError("");
  }

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();

    // Solo una sesión por día. Al editar, su propia fecha sí está permitida.
    const fechaOriginal = sesionEnEdicion?.fecha;
    if (fecha !== fechaOriginal && fechasOcupadas.includes(fecha)) {
      const mensaje = "Ya hay una sesión guardada para ese día. Edítala desde la lista en vez de crear otra.";
      setError(mensaje);
      mostrarToast(mensaje);
      return;
    }

    // Nos quedamos solo con los ejercicios que tienen nombre escrito.
    const completos = ejercicios.filter((e) => e.nombre.trim() !== "");
    if (completos.length === 0) {
      const mensaje = "Escribe al menos un ejercicio para guardar la sesión.";
      setError(mensaje);
      mostrarToast(mensaje);
      return;
    }

    // Cada ejercicio necesita al menos una tanda con reps (el peso es opcional).
    const sinTanda = completos.find((e) =>
      e.tandas.every((t) => t.reps.trim() === "" || Number(t.reps) <= 0)
    );
    if (sinTanda) {
      const mensaje = `"${sinTanda.nombre.trim()}" necesita al menos una tanda con reps para poder guardarlo.`;
      setError(mensaje);
      mostrarToast(mensaje);
      return;
    }

    onGuardar({
      id:
        sesionEnEdicion !== null
          ? sesionEnEdicion.id
          : Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      fecha,
      creadaEn: sesionEnEdicion !== null ? sesionEnEdicion.creadaEn : Date.now(),
      ejercicios: completos.map((e) => ({
        nombre: e.nombre.trim(),
        // La observación es opcional: vacía no se guarda.
        ...(e.observaciones.trim() !== ""
          ? { observaciones: e.observaciones.trim() }
          : {}),
        // Guardamos solo las tandas con algún dato; si están todas
        // vacías, guardamos una vacía para mostrar "—".
        tandas: (() => {
          const conDatos = e.tandas
            .filter((t) => t.reps.trim() !== "" || t.peso.trim() !== "")
            .map((t) => ({ reps: t.reps.trim(), peso: t.peso.trim() }));
          return conDatos.length > 0 ? conDatos : [{ reps: "", peso: "" }];
        })(),
      })),
    });

    // Al crear, limpiamos el formulario. Al editar, la página sale del
    // modo edición y este efecto ya limpia el formulario.
    if (sesionEnEdicion === null) {
      setFecha(hoyISO());
      setEjercicios([ejercicioVacio()]);
    }
    setError("");
    setToast("");
  }

  const plantillaSeleccionada = plantillas.find((p) => p.id === plantillaId);

  // Muestra el último uso del ejercicio como referencia, o nada si es nuevo.
  // Al editar se excluye la propia sesión para ver el uso anterior.
  function historialDe(nombre: string) {
    const uso = ultimoUso(sesiones, nombre, sesionEnEdicion?.id ?? null);
    if (!uso) return null;
    return (
      <p className={PISTA}>
        Última vez {formatearFecha(uso.fecha)}: {formatearTandas(uso.tandas)}
      </p>
    );
  }

  return (
    <section className={TARJETA} id="formulario-sesion">
      <h2 className={TITULO}>
        {sesionEnEdicion !== null
          ? `Editar sesión del ${formatearFecha(sesionEnEdicion.fecha)}`
          : "Registrar sesión"}
      </h2>

      <form onSubmit={enviar} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className={ETIQUETA} htmlFor="fecha">Fecha</label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className={CAMPO_ENTRADA}
          />
          <p className={PISTA}>Por defecto es hoy, pero puedes apuntar días anteriores.</p>
        </div>

        <h3 className={SUBTITULO}>Ejercicios</h3>

        <details className="flex flex-col gap-3">
          <summary className="flex min-h-11 cursor-pointer items-center text-[0.85rem] font-semibold text-suave marker:text-acento focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento">
            Plantilla
            {plantillaSeleccionada ? `: ${plantillaSeleccionada.nombre}` : ""}
          </summary>
          <div className="flex gap-2">
            <select
              id="plantilla"
              value={plantillaId}
              onChange={(e) => setPlantillaId(e.target.value)}
              aria-label="Elegir plantilla"
              className={`${CAMPO_ENTRADA} min-w-0 flex-1`}
            >
              <option value="">Elige una plantilla…</option>
              {plantillas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={BOTON_SECUNDARIO}
              onClick={aplicarPlantilla}
              disabled={!plantillaId}
            >
              Usar
            </button>
            <button
              type="button"
              className={BOTON_PELIGRO_MINI}
              onClick={eliminarPlantilla}
              disabled={!plantillaId}
              aria-label="Eliminar plantilla seleccionada"
            >
              Borrar
            </button>
          </div>
          <button
            type="button"
            className={BOTON_SECUNDARIO_SM}
            onClick={guardarComoPlantilla}
          >
            Guardar como plantilla
          </button>
          <p className={PISTA}>
            La plantilla guarda los ejercicios y el nº de tandas; los pesos y reps los rellenas cada día.
          </p>

          <div className="mt-3 flex flex-col gap-2.5 border-t border-dashed border-borde pt-3">
            <div className="flex flex-col gap-1.5">
              <label className={ETIQUETA} htmlFor="nueva-plantilla-nombre">O crea una desde cero</label>
              <input
                id="nueva-plantilla-nombre"
                type="text"
                placeholder="Pierna"
                value={nombreNueva}
                onChange={(e) => setNombreNueva(e.target.value)}
                className={CAMPO_ENTRADA}
              />
            </div>
            {filasNuevas.map((fila, i) => (
              <div className="flex gap-2" key={fila.id}>
                <input
                  type="text"
                  placeholder={`Ejercicio ${i + 1}`}
                  value={fila.nombre}
                  onChange={(e) => cambiarFilaPlantilla(fila.id, "nombre", e.target.value)}
                  aria-label={`Nombre del ejercicio ${i + 1} de la nueva plantilla`}
                  className={`${CAMPO_ENTRADA} min-w-0 flex-1`}
                />
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  placeholder="Nº"
                  value={fila.tandas}
                  onChange={(e) => cambiarFilaPlantilla(fila.id, "tandas", e.target.value)}
                  aria-label={`Nº de tandas del ejercicio ${i + 1}`}
                  className="min-h-11 w-[84px] flex-none rounded-[10px] border border-borde bg-hondo px-3 py-2.5 text-base text-texto focus-visible:border-transparent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-acento"
                />
                <button
                  type="button"
                  className={BOTON_PELIGRO_MINI}
                  onClick={() => quitarFilaPlantilla(fila.id)}
                  aria-label={`Quitar ejercicio ${i + 1} de la nueva plantilla`}
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                type="button"
                className={BOTON_SECUNDARIO_SM}
                onClick={añadirFilaPlantilla}
              >
                + Ejercicio
              </button>
              <button
                type="button"
                className={BOTON_PRINCIPAL}
                onClick={crearPlantilla}
              >
                Crear plantilla
              </button>
            </div>
          </div>
        </details>

        <div className="flex flex-col gap-3.5">
          {ejercicios.map((ejercicio, indice) => (
            <div className="flex flex-col gap-3 rounded-xl border border-borde bg-interior p-3.5" key={ejercicio.id}>
              <div className="flex flex-col gap-1.5">
                <label className={ETIQUETA} htmlFor={`nombre-${ejercicio.id}`}>Ejercicio {indice + 1}</label>
                <input
                  id={`nombre-${ejercicio.id}`}
                  type="text"
                  placeholder="Press de banca"
                  value={ejercicio.nombre}
                  onChange={(e) => cambiarNombreEjercicio(ejercicio.id, e.target.value)}
                  className={CAMPO_ENTRADA}
                />
                {historialDe(ejercicio.nombre)}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={ETIQUETA} htmlFor={`obs-${ejercicio.id}`}>Observaciones (opcional)</label>
                <input
                  id={`obs-${ejercicio.id}`}
                  type="text"
                  placeholder="Agarre estrecho, con banda…"
                  value={ejercicio.observaciones}
                  onChange={(e) => cambiarObservaciones(ejercicio.id, e.target.value)}
                  className={CAMPO_ENTRADA}
                />
              </div>

              <div className="flex flex-col gap-2.5">
                {ejercicio.tandas.map((tanda, i) => (
                  <div className="rounded-[10px] border border-dashed border-borde bg-hondo p-2.5" key={tanda.id}>
                    <span className="inline-block rounded-md border border-borde bg-interior px-2 py-0.5 text-[0.78rem] font-bold text-texto">Tanda {i + 1}</span>
                    <div className="mt-2 grid grid-cols-[1fr_1fr_auto] items-end gap-2.5">
                      <div className="flex flex-col gap-1.5">
                        <label className={ETIQUETA} htmlFor={`reps-${tanda.id}`}>Reps</label>
                        <input
                          id={`reps-${tanda.id}`}
                          type="number"
                          min="1"
                          inputMode="numeric"
                          placeholder="10"
                          value={tanda.reps}
                          onChange={(e) =>
                            cambiarTanda(ejercicio.id, tanda.id, "reps", e.target.value)
                          }
                          className={CAMPO_ENTRADA}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className={ETIQUETA} htmlFor={`peso-${tanda.id}`}>Peso (kg)</label>
                        <input
                          id={`peso-${tanda.id}`}
                          type="number"
                          min="0"
                          step="0.5"
                          inputMode="decimal"
                          placeholder="60"
                          value={tanda.peso}
                          onChange={(e) =>
                            cambiarTanda(ejercicio.id, tanda.id, "peso", e.target.value)
                          }
                          className={CAMPO_ENTRADA}
                        />
                      </div>
                      <button
                        type="button"
                        className={BOTON_PELIGRO_TANDA}
                        onClick={() => quitarTanda(ejercicio.id, tanda.id)}
                        aria-label={`Quitar tanda ${i + 1} del ejercicio ${indice + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                    <button
                      type="button"
                      className={`${BOTON_SECUNDARIO_SM} mt-2 w-full`}
                      onClick={marcarTandaHecha}
                      aria-label={`Marcar tanda ${i + 1} del ejercicio ${indice + 1} como hecha y descansar`}
                    >
                      Hecha ✓ descansar
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={BOTON_SECUNDARIO_SM}
                onClick={() => añadirTanda(ejercicio.id)}
              >
                + Añadir tanda
              </button>

              <button
                type="button"
                className={BOTON_PELIGRO_SM}
                onClick={() => quitarEjercicio(ejercicio.id)}
                aria-label={`Quitar ejercicio ${indice + 1}`}
              >
                Quitar ejercicio
              </button>
            </div>
          ))}
        </div>

        <button type="button" className={BOTON_SECUNDARIO} onClick={añadirEjercicio}>
          + Añadir ejercicio
        </button>

        {error && <p className={ERROR}>{error}</p>}

        <button type="submit" className={BOTON_PRINCIPAL}>
          {sesionEnEdicion !== null ? "Guardar cambios" : "Guardar sesión"}
        </button>

        {sesionEnEdicion !== null && (
          <button type="button" className={BOTON_SECUNDARIO} onClick={onCancelar}>
            Cancelar edición
          </button>
        )}
      </form>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,480px)] -translate-x-1/2 rounded-xl border border-borde bg-black px-4 py-3 text-[0.9rem] font-semibold text-texto shadow-[0_10px_30px_rgba(0,0,0,0.5)] anim-toast" role="alert" aria-live="assertive">
          {toast}
        </div>
      )}
    </section>
  );
}
