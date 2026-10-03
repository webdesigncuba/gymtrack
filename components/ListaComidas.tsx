"use client";

import { useState } from "react";
import { formatearFecha, hoyISO } from "@/lib/fechas";
import { ordenarComidas, totalesDelDia } from "@/lib/alimentos";
import {
  BOTON_PELIGRO_MINI,
  CAMPO_ENTRADA,
  ETIQUETA,
  TARJETA,
  TITULO,
} from "@/lib/estilos";
import type { Comida } from "@/lib/tipos";

interface Props {
  comidas: Comida[];
  onEliminar: (id: string) => void;
}

/**
 * Comidas del día elegido con sus totales (kcal + carbos, proteínas y grasas).
 * Recibe todas las comidas y filtra por el día (por defecto hoy).
 */
export default function ListaComidas({ comidas, onEliminar }: Props) {
  const [fecha, setFecha] = useState(hoyISO());

  const delDia = ordenarComidas(comidas.filter((c) => c.fecha === fecha));
  const totales = totalesDelDia(comidas, fecha);

  return (
    <section className={TARJETA}>
      <h2 className={TITULO}>
        Comidas del día{" "}
        {delDia.length > 0 && (
          <span className="rounded-full bg-acento px-2.5 py-0.5 text-[0.8rem] font-bold text-acento-texto">
            {delDia.length}
          </span>
        )}
      </h2>

      <div className="mb-3.5 flex flex-col gap-1.5">
        <label className={ETIQUETA} htmlFor="comidas-fecha">
          Día
        </label>
        <input
          id="comidas-fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
          className={CAMPO_ENTRADA}
        />
      </div>

      <p
        className="m-0 mb-3.5 rounded-[10px] border border-borde bg-interior p-[10px_12px] text-[0.9rem]"
        aria-live="polite"
      >
        {formatearFecha(fecha)}: {totales.kcal} kcal · C {totales.carbos} · P{" "}
        {totales.proteinas} · G {totales.grasas}
      </p>

      {delDia.length === 0 ? (
        <p className="m-0 px-0 py-3 text-center text-suave">
          Sin comidas este día. ¡Registra la primera! 🍽️
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {delDia.map((comida) => (
            <li
              className="flex items-center justify-between gap-2.5 rounded-xl border border-borde bg-interior p-3.5"
              key={comida.id}
            >
              <div className="min-w-0">
                <p className="m-0 font-semibold capitalize">{comida.nombre}</p>
                <p className="m-0 mt-1 text-[0.85rem] text-suave">
                  {comida.gramos} g · {comida.kcal} kcal · C {comida.carbos} · P{" "}
                  {comida.proteinas} · G {comida.grasas}
                </p>
              </div>
              <button
                type="button"
                className={BOTON_PELIGRO_MINI}
                onClick={() => onEliminar(comida.id)}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
