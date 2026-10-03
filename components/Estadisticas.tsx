import { useState } from "react";
import {
  mejorRacha,
  recordsPorEjercicio,
  tandasPorSemana,
  volumenTotal,
} from "@/lib/estadisticas";
import {
  diasDelMes,
  mesActual,
  moverMes,
  tituloMes,
} from "@/lib/calendario";
import { hoyISO } from "@/lib/fechas";
import { TARJETA, TITULO } from "@/lib/estilos";
import type { Sesion } from "@/lib/tipos";

interface Props {
  sesiones: Sesion[];
}

// Iniciales de la semana empezando en lunes.
const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

/**
 * Tarjeta de estadísticas: volumen total, tandas de esta semana,
 * mejor racha histórica, récords y calendario de calor.
 */
export default function Estadisticas({ sesiones }: Props) {
  // Meses de desplazamiento respecto al actual (0 = mes en curso).
  const [desplazamiento, setDesplazamiento] = useState(0);

  if (sesiones.length === 0) return null;

  const volumen = volumenTotal(sesiones);
  const semanas = tandasPorSemana(sesiones);
  const estaSemana = semanas[semanas.length - 1]?.tandas ?? 0;
  const mejor = mejorRacha(sesiones.map((s) => s.fecha));
  const maximo = Math.max(1, ...semanas.map((s) => s.tandas));
  const textoVolumen = volumen.toLocaleString("es-ES", { maximumFractionDigits: 1 });
  const records = recordsPorEjercicio(sesiones);

  const hoy = hoyISO();
  const base = mesActual();
  const visible = moverMes(base.anio, base.mes, desplazamiento);
  const entrenados = new Set(sesiones.map((s) => s.fecha));

  return (
    <section className={TARJETA} aria-live="polite">
      <h2 className={TITULO}>Estadísticas</h2>

      <div className="mb-4 grid grid-cols-3 gap-2.5 text-center">
        <div>
          <p className="m-0 font-display text-[clamp(1.3rem,6vw,1.8rem)] font-bold leading-[1.1] tabular-nums text-acento">
            {textoVolumen} kg
          </p>
          <p className="mt-1 text-[0.78rem] text-suave">Volumen total</p>
        </div>
        <div>
          <p className="m-0 font-display text-[clamp(1.3rem,6vw,1.8rem)] font-bold leading-[1.1] tabular-nums text-acento">
            {estaSemana}
          </p>
          <p className="mt-1 text-[0.78rem] text-suave">Tandas esta semana</p>
        </div>
        <div>
          <p className="m-0 font-display text-[clamp(1.3rem,6vw,1.8rem)] font-bold leading-[1.1] tabular-nums text-acento">
            {mejor} 🔥
          </p>
          <p className="mt-1 text-[0.78rem] text-suave">Mejor racha</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {semanas.map((semana) => (
          <div className="grid grid-cols-[52px_1fr_28px] items-center gap-2 text-[0.8rem]" key={semana.clave}>
            <span className="text-suave">{semana.etiqueta}</span>
            <span className="block h-2.5 overflow-hidden rounded-full border border-borde bg-hondo">
              <span
                className="block h-full rounded-full bg-acento"
                style={{ width: `${(semana.tandas / maximo) * 100}%` }}
              />
            </span>
            <span className="text-right tabular-nums">{semana.tandas}</span>
          </div>
        ))}
      </div>

      {records.length > 0 && (
        <div className="mt-4 border-t border-dashed border-borde pt-4">
          <h3 className="mb-2 text-[0.95rem]">Récords</h3>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {records.map((record) => (
              <li className="flex justify-between gap-2.5 text-[0.88rem]" key={record.nombre.toLowerCase()}>
                <span>{record.nombre}</span>
                <span className="whitespace-nowrap font-bold tabular-nums text-acento">
                  {record.peso.toLocaleString("es-ES", { maximumFractionDigits: 1 })} kg 🏆
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 border-t border-dashed border-borde pt-4">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <button
            type="button"
            className="min-h-0 cursor-pointer rounded-[10px] border border-borde bg-transparent px-3.5 py-1 text-[1.1rem] leading-[1.4] text-texto transition-colors hover:bg-interior focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
            onClick={() => setDesplazamiento((n) => n - 1)}
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <h3 className="m-0 text-[0.95rem]">{tituloMes(visible.anio, visible.mes)}</h3>
          <button
            type="button"
            className="min-h-0 cursor-pointer rounded-[10px] border border-borde bg-transparent px-3.5 py-1 text-[1.1rem] leading-[1.4] text-texto transition-colors hover:bg-interior focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
            onClick={() => setDesplazamiento((n) => n + 1)}
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {DIAS_SEMANA.map((dia) => (
            <span className="text-[0.72rem] font-bold text-suave" key={dia}>
              {dia}
            </span>
          ))}
          {diasDelMes(visible.anio, visible.mes).map((fila, i) =>
            fila.map((celda, j) =>
              celda === null ? (
                <span key={`${i}-${j}`} />
              ) : (
                <span
                  className={
                    "flex aspect-square items-center justify-center rounded-lg border text-[0.8rem] tabular-nums " +
                    (entrenados.has(celda)
                      ? "border-acento bg-acento font-bold text-acento-texto"
                      : "border-borde bg-hondo") +
                    (celda === hoy ? " border-2 border-acento" : "")
                  }
                  key={celda}
                  aria-label={`${Number(celda.slice(8))}: ${entrenados.has(celda) ? "entrenado" : "descanso"}`}
                >
                  {Number(celda.slice(8))}
                </span>
              )
            )
          )}
        </div>
      </div>
    </section>
  );
}
