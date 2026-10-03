"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { LIMITES_PERFIL } from "@/lib/perfil";
import {
  caloriasNecesarias,
  ETIQUETAS_ACTIVIDAD,
  ETIQUETAS_OBJETIVO,
} from "@/lib/nutricion";
import {
  BOTON_PRINCIPAL,
  CAMPO_ENTRADA,
  ERROR,
  ETIQUETA,
  PISTA,
  TARJETA,
  TITULO,
} from "@/lib/estilos";
import type { Actividad, Objetivo, Perfil, Sexo } from "@/lib/tipos";

interface Props {
  perfil: Perfil | null;
  onGuardar: (perfil: Perfil) => void;
}

/**
 * Datos del usuario: edad, estatura, peso, sexo, actividad y objetivo.
 * Con todo relleno calcula las calorías diarias que necesita
 * (orientativo, no es una recomendación médica).
 */
export default function Perfil({ perfil, onGuardar }: Props) {
  const [edad, setEdad] = useState("");
  const [estatura, setEstatura] = useState("");
  const [peso, setPeso] = useState("");
  const [sexo, setSexo] = useState("");
  const [actividad, setActividad] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [guardado, setGuardado] = useState(false);
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

  // Cuando el perfil cargado cambia (login, respaldo), lo mostramos.
  useEffect(() => {
    setEdad(perfil?.edadAnos?.toString() ?? "");
    setEstatura(perfil?.estaturaCm?.toString() ?? "");
    setPeso(perfil?.pesoKg?.toString() ?? "");
    setSexo(perfil?.sexo ?? "");
    setActividad(perfil?.actividad ?? "");
    setObjetivo(perfil?.objetivo ?? "");
    setError("");
  }, [perfil]);

  // Vacío vale (se guarda como null); con número exige estar en rango.
  function leerCampo(
    texto: string,
    min: number,
    max: number,
    etiqueta: string
  ): number | null | undefined {
    if (texto.trim() === "") return null;
    const valor = parseFloat(texto);
    if (!Number.isFinite(valor) || valor < min || valor > max) return undefined;
    return valor;
  }

  function enviar(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    const edadAnos = leerCampo(
      edad,
      LIMITES_PERFIL.edadAnos.min,
      LIMITES_PERFIL.edadAnos.max,
      "La edad"
    );
    const estaturaCm = leerCampo(
      estatura,
      LIMITES_PERFIL.estaturaCm.min,
      LIMITES_PERFIL.estaturaCm.max,
      "La estatura"
    );
    const pesoKg = leerCampo(
      peso,
      LIMITES_PERFIL.pesoKg.min,
      LIMITES_PERFIL.pesoKg.max,
      "El peso"
    );
    const fallos: string[] = [];
    if (edadAnos === undefined)
      fallos.push(`La edad debe estar entre ${LIMITES_PERFIL.edadAnos.min} y ${LIMITES_PERFIL.edadAnos.max} años.`);
    if (estaturaCm === undefined)
      fallos.push(`La estatura debe estar entre ${LIMITES_PERFIL.estaturaCm.min} y ${LIMITES_PERFIL.estaturaCm.max} cm.`);
    if (pesoKg === undefined)
      fallos.push(`El peso debe estar entre ${LIMITES_PERFIL.pesoKg.min} y ${LIMITES_PERFIL.pesoKg.max} kg.`);
    if (fallos.length > 0) {
      const mensaje = fallos[0];
      setError(mensaje);
      mostrarToast(mensaje);
      setGuardado(false);
      return;
    }
    onGuardar({
      edadAnos: edadAnos ?? null,
      estaturaCm: estaturaCm ?? null,
      pesoKg: pesoKg ?? null,
      sexo: (sexo === "" ? null : sexo) as Sexo | null,
      actividad: (actividad === "" ? null : actividad) as Actividad | null,
      objetivo: (objetivo === "" ? null : objetivo) as Objetivo | null,
    });
    setError("");
    setToast("");
    setGuardado(true);
  }

  // Vista previa en vivo con lo escrito (sin esperar a guardar).
  const borrador: Perfil = {
    edadAnos: parseFloat(edad),
    estaturaCm: parseFloat(estatura),
    pesoKg: parseFloat(peso),
    sexo: (sexo === "" ? null : sexo) as Sexo | null,
    actividad: (actividad === "" ? null : actividad) as Actividad | null,
    objetivo: (objetivo === "" ? null : objetivo) as Objetivo | null,
  };
  const calculo =
    Number.isFinite(borrador.edadAnos) &&
    Number.isFinite(borrador.estaturaCm) &&
    Number.isFinite(borrador.pesoKg)
      ? caloriasNecesarias(borrador)
      : null;

  return (
    <section className={TARJETA} id="perfil">
      <h2 className={TITULO}>Mis datos</h2>
      <p className={PISTA}>
        Se guardan en tu cuenta y calculan las calorías que necesitas.
        Puedes dejar vacío lo que no quieras rellenar.
      </p>

      <form onSubmit={enviar} className="mt-3.5 flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label className={ETIQUETA} htmlFor="perfil-edad">
            Edad (años)
          </label>
          <input
            id="perfil-edad"
            type="number"
            min={LIMITES_PERFIL.edadAnos.min}
            max={LIMITES_PERFIL.edadAnos.max}
            step="1"
            inputMode="numeric"
            placeholder="30"
            value={edad}
            onChange={(e) => {
              setEdad(e.target.value);
              setGuardado(false);
            }}
            className={CAMPO_ENTRADA}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ETIQUETA} htmlFor="perfil-estatura">
            Estatura (cm)
          </label>
          <input
            id="perfil-estatura"
            type="number"
            min={LIMITES_PERFIL.estaturaCm.min}
            max={LIMITES_PERFIL.estaturaCm.max}
            step="any"
            inputMode="decimal"
            placeholder="175"
            value={estatura}
            onChange={(e) => {
              setEstatura(e.target.value);
              setGuardado(false);
            }}
            className={CAMPO_ENTRADA}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ETIQUETA} htmlFor="perfil-peso">
            Peso (kg)
          </label>
          <input
            id="perfil-peso"
            type="number"
            min={LIMITES_PERFIL.pesoKg.min}
            max={LIMITES_PERFIL.pesoKg.max}
            step="any"
            inputMode="decimal"
            placeholder="70"
            value={peso}
            onChange={(e) => {
              setPeso(e.target.value);
              setGuardado(false);
            }}
            className={CAMPO_ENTRADA}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ETIQUETA} htmlFor="perfil-sexo">
            Sexo
          </label>
          <select
            id="perfil-sexo"
            value={sexo}
            onChange={(e) => {
              setSexo(e.target.value);
              setGuardado(false);
            }}
            className={CAMPO_ENTRADA}
          >
            <option value="">Elige…</option>
            <option value="hombre">Hombre</option>
            <option value="mujer">Mujer</option>
          </select>
          <p className={PISTA}>La fórmula lo necesita: el cálculo cambia.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ETIQUETA} htmlFor="perfil-actividad">
            Actividad
          </label>
          <select
            id="perfil-actividad"
            value={actividad}
            onChange={(e) => {
              setActividad(e.target.value);
              setGuardado(false);
            }}
            className={CAMPO_ENTRADA}
          >
            <option value="">Elige…</option>
            {ETIQUETAS_ACTIVIDAD.map((a) => (
              <option key={a.id} value={a.id}>
                {a.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ETIQUETA} htmlFor="perfil-objetivo">
            Objetivo (opcional)
          </label>
          <select
            id="perfil-objetivo"
            value={objetivo}
            onChange={(e) => {
              setObjetivo(e.target.value);
              setGuardado(false);
            }}
            className={CAMPO_ENTRADA}
          >
            <option value="">Mantener peso</option>
            {ETIQUETAS_OBJETIVO.map((o) => (
              <option key={o.id} value={o.id}>
                {o.etiqueta}
              </option>
            ))}
          </select>
        </div>

        {calculo && (
          <p
            className="m-0 rounded-[10px] border border-borde bg-interior p-[10px_12px] text-[0.9rem]"
            aria-live="polite"
          >
            Necesitas ≈ {calculo.objetivo} kcal/día (basal {calculo.tmb} ×
            actividad = {calculo.tdee}). Orientativo, no es consejo médico.
          </p>
        )}

        {error && <p className={ERROR}>{error}</p>}
        {guardado && !error && (
          <p className="m-0 rounded-[10px] border border-exito-borde bg-exito-fondo p-[10px_12px] text-[0.9rem] text-exito-texto">
            Datos guardados.
          </p>
        )}

        <button type="submit" className={BOTON_PRINCIPAL}>
          Guardar datos
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
