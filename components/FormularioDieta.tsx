"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { hoyISO } from "@/lib/fechas";
import {
  ALIMENTOS_BASE,
  buscarAlimento,
  calcularNutrientes,
  crearComida,
  normalizarAlimento,
} from "@/lib/alimentos";
import {
  backendLocalAlimentos,
  type BackendAlimentos,
} from "@/lib/alimentosCustom";
import { buscarOnline, type AlimentoOnline } from "@/lib/alimentosRemotos";
import {
  BOTON_PRINCIPAL,
  BOTON_SECUNDARIO,
  BOTON_SECUNDARIO_SM,
  CAMPO_ENTRADA,
  ERROR,
  ETIQUETA,
  PISTA,
  TARJETA,
  TITULO,
} from "@/lib/estilos";
import type { Alimento, Comida } from "@/lib/tipos";

interface Props {
  onGuardar: (comida: Comida) => void;
  backendAlimentos?: BackendAlimentos;
  senalAlimentos?: number;
}

/**
 * Formulario para registrar una comida del día.
 * - Escribes el nombre ("pan", "arroz", "pollo"...) y los gramos.
 * - Si está en la base (o en "mis alimentos"), calcula sola kcal y macros.
 * - Si no está, te deja meter los valores a mano y guardarlos para reutilizar.
 * - "Buscar online" consulta Open Food Facts solo al pulsarlo (sale a internet).
 */
export default function FormularioDieta({
  onGuardar,
  backendAlimentos = backendLocalAlimentos,
  senalAlimentos = 0,
}: Props) {
  const [fecha, setFecha] = useState(hoyISO());
  const [nombre, setNombre] = useState("");
  const [gramos, setGramos] = useState("");
  const [kcalManual, setKcalManual] = useState("");
  const [carbosManual, setCarbosManual] = useState("");
  const [proteinasManual, setProteinasManual] = useState("");
  const [grasasManual, setGrasasManual] = useState("");
  const [guardarEnMis, setGuardarEnMis] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const toastTemporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Alimentos guardados por el usuario + resultados de la búsqueda online.
  const [customs, setCustoms] = useState<Alimento[]>([]);
  const [online, setOnline] = useState<AlimentoOnline[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [errorOnline, setErrorOnline] = useState("");

  function mostrarToast(mensaje: string): void {
    setToast(mensaje);
    if (toastTemporizador.current) clearTimeout(toastTemporizador.current);
    toastTemporizador.current = setTimeout(() => setToast(""), 3500);
  }

  useEffect(() => {
    return () => {
      if (toastTemporizador.current) clearTimeout(toastTemporizador.current);
    };
  }, []);

  // Cargamos "mis alimentos" al montar, al cambiar de fuente y cuando el
  // respaldo restaura unos nuevos.
  useEffect(() => {
    let vivo = true;
    backendAlimentos
      .cargar()
      .then((guardados) => {
        if (vivo) setCustoms(guardados);
      })
      .catch((error) => {
        console.warn("No se pudieron cargar los alimentos personalizados:", error);
      });
    return () => {
      vivo = false;
    };
  }, [senalAlimentos, backendAlimentos]);

  // Los personalizados mandan sobre la base si repiten nombre.
  const base = useMemo(() => [...customs, ...ALIMENTOS_BASE], [customs]);

  const alimento = buscarAlimento(nombre, base);
  const gramosNum = parseFloat(gramos);
  const gramosValidos = Number.isFinite(gramosNum) && gramosNum > 0;
  const vistaPrevia =
    alimento && gramosValidos ? calcularNutrientes(alimento, gramosNum) : null;
  const esManual = nombre.trim() !== "" && !alimento;

  function fallar(mensaje: string): void {
    setError(mensaje);
    mostrarToast(mensaje);
  }

  // Guarda "mis alimentos" (reemplazando por nombre normalizado) en la
  // fuente activa (nube + espejo local si hay login).
  async function persistirCustom(nuevo: Alimento): Promise<Alimento[]> {
    const buscado = normalizarAlimento(nuevo.nombre);
    const actualizados = [
      nuevo,
      ...customs.filter((a) => normalizarAlimento(a.nombre) !== buscado),
    ];
    await backendAlimentos.guardar(actualizados).catch((error) => {
      console.warn("No se pudo guardar el alimento personalizado:", error);
    });
    setCustoms(actualizados);
    return actualizados;
  }

  async function buscarEnInternet(): Promise<void> {
    if (nombre.trim() === "") {
      setErrorOnline("Escribe un nombre para buscar online.");
      return;
    }
    setBuscando(true);
    setErrorOnline("");
    try {
      setOnline(await buscarOnline(nombre.trim()));
    } catch (error) {
      console.warn("La búsqueda online falló:", error);
      setErrorOnline("No se pudo buscar online. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setBuscando(false);
    }
  }

  async function usarOnline(resultado: AlimentoOnline): Promise<void> {
    await persistirCustom({
      nombre: resultado.nombre,
      kcal: resultado.kcal,
      carbos: resultado.carbos,
      proteinas: resultado.proteinas,
      grasas: resultado.grasas,
    });
    setNombre(resultado.nombre);
    setOnline([]);
    setError("");
  }

  function limpiar(): void {
    // Dejamos la fecha para apuntar varias comidas del mismo día seguidas.
    setNombre("");
    setGramos("");
    setKcalManual("");
    setCarbosManual("");
    setProteinasManual("");
    setGrasasManual("");
    setOnline([]);
    setErrorOnline("");
    setError("");
    setToast("");
  }

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      fallar("Elige una fecha válida.");
      return;
    }
    if (nombre.trim() === "") {
      fallar("Escribe el nombre del alimento para guardar la comida.");
      return;
    }
    if (!gramosValidos) {
      fallar("Indica los gramos (un número mayor que 0).");
      return;
    }
    if (alimento) {
      onGuardar(crearComida(fecha, alimento, gramosNum));
      limpiar();
      return;
    }
    const kcal = parseFloat(kcalManual);
    if (!Number.isFinite(kcal) || kcal <= 0) {
      fallar("Ese alimento no está en la base: mete al menos sus calorías a mano.");
      return;
    }
    const carbos = parseFloat(carbosManual);
    const proteinas = parseFloat(proteinasManual);
    const grasas = parseFloat(grasasManual);
    onGuardar({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      fecha,
      nombre: nombre.trim(),
      gramos: gramosNum,
      kcal,
      carbos: Number.isFinite(carbos) && carbos >= 0 ? carbos : 0,
      proteinas: Number.isFinite(proteinas) && proteinas >= 0 ? proteinas : 0,
      grasas: Number.isFinite(grasas) && grasas >= 0 ? grasas : 0,
      creadaEn: Date.now(),
    });
    // Lo manual viene para esos gramos: lo pasamos a 100 g para reutilizarlo.
    if (guardarEnMis) {
      const factor = 100 / gramosNum;
      const redondear1 = (v: number): number => Math.round(v * factor * 10) / 10;
      void persistirCustom({
        nombre: nombre.trim(),
        kcal: Math.round(kcal * factor * 10) / 10,
        carbos: Number.isFinite(carbos) && carbos >= 0 ? redondear1(carbos) : 0,
        proteinas: Number.isFinite(proteinas) && proteinas >= 0 ? redondear1(proteinas) : 0,
        grasas: Number.isFinite(grasas) && grasas >= 0 ? redondear1(grasas) : 0,
      });
    }
    limpiar();
  }

  return (
    <section className={TARJETA} id="formulario-dieta">
      <h2 className={TITULO}>Registrar comida</h2>

      <form onSubmit={enviar} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className={ETIQUETA} htmlFor="dieta-fecha">
            Fecha
          </label>
          <input
            id="dieta-fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className={CAMPO_ENTRADA}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ETIQUETA} htmlFor="dieta-nombre">
            Alimento
          </label>
          <input
            id="dieta-nombre"
            type="text"
            placeholder="pan, arroz, pollo…"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            list="dieta-alimentos"
            autoComplete="off"
            className={CAMPO_ENTRADA}
          />
          <datalist id="dieta-alimentos">
            {base.map((a) => (
              <option key={a.nombre} value={a.nombre} />
            ))}
          </datalist>
          {alimento ? (
            <p className={PISTA}>
              Base: {alimento.nombre} ({alimento.kcal} kcal / 100 g)
              {customs.some(
                (c) => normalizarAlimento(c.nombre) === normalizarAlimento(alimento.nombre)
              )
                ? " · de tus alimentos"
                : ""}
            </p>
          ) : (
            <p className={PISTA}>
              Prueba con “arroz” o “pollo”: si no está, lo metes a mano o lo buscas online.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ETIQUETA} htmlFor="dieta-gramos">
            Cantidad (g)
          </label>
          <input
            id="dieta-gramos"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            placeholder="50"
            value={gramos}
            onChange={(e) => setGramos(e.target.value)}
            className={CAMPO_ENTRADA}
          />
        </div>

        {vistaPrevia && (
          <p
            className="m-0 rounded-[10px] border border-borde bg-interior p-[10px_12px] text-[0.9rem]"
            aria-live="polite"
          >
            {gramosNum} g → {vistaPrevia.kcal} kcal · C {vistaPrevia.carbos} · P{" "}
            {vistaPrevia.proteinas} · G {vistaPrevia.grasas}
          </p>
        )}

        {esManual && (
          <div className="flex flex-col gap-2.5 rounded-xl border border-dashed border-borde bg-interior p-3.5">
            <p className={PISTA}>
              No está en la base: mete sus valores para esos gramos.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className={ETIQUETA} htmlFor="dieta-kcal">
                  Kcal
                </label>
                <input
                  id="dieta-kcal"
                  type="number"
                  min="1"
                  step="any"
                  inputMode="decimal"
                  placeholder="130"
                  value={kcalManual}
                  onChange={(e) => setKcalManual(e.target.value)}
                  className={CAMPO_ENTRADA}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={ETIQUETA} htmlFor="dieta-carbos">
                  Carbos (g)
                </label>
                <input
                  id="dieta-carbos"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="28"
                  value={carbosManual}
                  onChange={(e) => setCarbosManual(e.target.value)}
                  className={CAMPO_ENTRADA}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={ETIQUETA} htmlFor="dieta-proteinas">
                  Proteínas (g)
                </label>
                <input
                  id="dieta-proteinas"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="3"
                  value={proteinasManual}
                  onChange={(e) => setProteinasManual(e.target.value)}
                  className={CAMPO_ENTRADA}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={ETIQUETA} htmlFor="dieta-grasas">
                  Grasas (g)
                </label>
                <input
                  id="dieta-grasas"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  placeholder="1"
                  value={grasasManual}
                  onChange={(e) => setGrasasManual(e.target.value)}
                  className={CAMPO_ENTRADA}
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[0.85rem] font-semibold text-suave">
              <input
                type="checkbox"
                checked={guardarEnMis}
                onChange={(e) => setGuardarEnMis(e.target.checked)}
                className="h-5 w-5 accent-[#f5a524]"
              />
              Guardar en mis alimentos para reutilizarlo
            </label>
          </div>
        )}

        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-borde bg-interior p-3.5">
          <div className="flex gap-2">
            <button
              type="button"
              className={`${BOTON_SECUNDARIO} flex-1`}
              onClick={buscarEnInternet}
              disabled={buscando || nombre.trim() === ""}
            >
              {buscando ? "Buscando…" : "Buscar online"}
            </button>
            {online.length > 0 && (
              <button
                type="button"
                className={BOTON_SECUNDARIO_SM}
                onClick={() => setOnline([])}
              >
                Limpiar
              </button>
            )}
          </div>
          <p className={PISTA}>
            La búsqueda online sale a Open Food Facts. Lo que elijas se guarda en
            tus alimentos y queda disponible sin conexión.
          </p>
          {errorOnline && <p className={ERROR}>{errorOnline}</p>}
          {online.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {online.map((r) => (
                <li
                  key={`${r.nombre}-${r.marca ?? ""}`}
                  className="flex items-center gap-2 rounded-[10px] border border-borde bg-hondo p-2.5"
                >
                  <span className="min-w-0 flex-1 text-[0.85rem]">
                    <strong>{r.nombre}</strong>
                    {r.marca ? <span className="text-suave"> · {r.marca}</span> : null}
                    <br />
                    <span className="text-suave">
                      {r.kcal} kcal / 100 g · C {r.carbos} · P {r.proteinas} · G {r.grasas}
                    </span>
                  </span>
                  <button
                    type="button"
                    className={BOTON_SECUNDARIO_SM}
                    onClick={() => void usarOnline(r)}
                  >
                    Usar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className={ERROR}>{error}</p>}

        <button type="submit" className={BOTON_PRINCIPAL}>
          Guardar comida
        </button>
      </form>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,480px)] -translate-x-1/2 rounded-xl border border-borde bg-black px-4 py-3 text-[0.9rem] font-semibold text-texto shadow-[0_10px_30px_rgba(0,0,0,0.5)] anim-toast"
          role="alert"
          aria-live="assertive"
        >
          {toast}
        </div>
      )}
    </section>
  );
}
