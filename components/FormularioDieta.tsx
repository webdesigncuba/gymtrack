"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { hoyISO } from "@/lib/fechas";
import {
  ALIMENTOS_BASE,
  buscarAlimento,
  calcularNutrientes,
  crearComida,
} from "@/lib/alimentos";
import {
  BOTON_PRINCIPAL,
  CAMPO_ENTRADA,
  ERROR,
  ETIQUETA,
  PISTA,
  TARJETA,
  TITULO,
} from "@/lib/estilos";
import type { Comida } from "@/lib/tipos";

interface Props {
  onGuardar: (comida: Comida) => void;
}

/**
 * Formulario para registrar una comida del día.
 * - Escribes el nombre ("pan", "pao", "arroz"...) y los gramos.
 * - Si está en la base, calcula sola kcal, carbos, proteínas y grasas.
 * - Si no está, te deja meter los valores a mano.
 */
export default function FormularioDieta({ onGuardar }: Props) {
  const [fecha, setFecha] = useState(hoyISO());
  const [nombre, setNombre] = useState("");
  const [gramos, setGramos] = useState("");
  const [kcalManual, setKcalManual] = useState("");
  const [carbosManual, setCarbosManual] = useState("");
  const [proteinasManual, setProteinasManual] = useState("");
  const [grasasManual, setGrasasManual] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const toastTemporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const alimento = buscarAlimento(nombre);
  const gramosNum = parseFloat(gramos);
  const gramosValidos = Number.isFinite(gramosNum) && gramosNum > 0;
  const vistaPrevia =
    alimento && gramosValidos ? calcularNutrientes(alimento, gramosNum) : null;
  const esManual = nombre.trim() !== "" && !alimento;

  function fallar(mensaje: string): void {
    setError(mensaje);
    mostrarToast(mensaje);
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
    } else {
      const kcal = parseFloat(kcalManual);
      if (!Number.isFinite(kcal) || kcal <= 0) {
        fallar(
          "Ese alimento no está en la base: mete al menos sus calorías a mano."
        );
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
    }
    // Dejamos la fecha para apuntar varias comidas del mismo día seguidas.
    setNombre("");
    setGramos("");
    setKcalManual("");
    setCarbosManual("");
    setProteinasManual("");
    setGrasasManual("");
    setError("");
    setToast("");
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
            {ALIMENTOS_BASE.map((a) => (
              <option key={a.nombre} value={a.nombre} />
            ))}
          </datalist>
          {alimento ? (
            <p className={PISTA}>
              Base: {alimento.nombre} ({alimento.kcal} kcal / 100 g)
            </p>
          ) : (
            <p className={PISTA}>
              Prueba con “pao” o “arroz”: si no está en la base, lo metes a mano.
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
          </div>
        )}

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
