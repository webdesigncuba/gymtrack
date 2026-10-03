import { kcalPorDia, redondear1 } from "@/lib/alimentos";
import { TARJETA, TITULO } from "@/lib/estilos";
import type { Comida } from "@/lib/tipos";

interface Props {
  comidas: Comida[];
}

/**
 * Progreso de dieta de los últimos 7 días: promedio diario, hoy y
 * días con registro, más barras de kcal por día. La comparativa
 * hoy/objetivo vive en el héroe (`BalanceCalorico`).
 */
export default function ProgresoDieta({ comidas }: Props) {
  if (comidas.length === 0) return null;

  const dias = kcalPorDia(comidas, 7);
  const suma = dias.reduce((acc, d) => acc + d.kcal, 0);
  const promedio = redondear1(suma / dias.length);
  const hoy = dias[dias.length - 1].kcal;
  const conRegistro = dias.filter((d) => d.kcal > 0).length;
  const maximo = Math.max(1, ...dias.map((d) => d.kcal));

  return (
    <section className={TARJETA} aria-live="polite">
      <h2 className={TITULO}>Progreso de dieta</h2>

      <div className="mb-4 grid grid-cols-3 gap-2.5 text-center">
        <div>
          <p className="m-0 font-display text-[clamp(1.3rem,6vw,1.8rem)] font-bold leading-[1.1] tabular-nums text-acento">
            {promedio}
          </p>
          <p className="mt-1 text-[0.78rem] text-suave">Kcal/día (7 días)</p>
        </div>
        <div>
          <p className="m-0 font-display text-[clamp(1.3rem,6vw,1.8rem)] font-bold leading-[1.1] tabular-nums text-acento">
            {hoy}
          </p>
          <p className="mt-1 text-[0.78rem] text-suave">Kcal hoy</p>
        </div>
        <div>
          <p className="m-0 font-display text-[clamp(1.3rem,6vw,1.8rem)] font-bold leading-[1.1] tabular-nums text-acento">
            {conRegistro}/7
          </p>
          <p className="mt-1 text-[0.78rem] text-suave">Días con registro</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {dias.map((dia) => (
          <div
            className="grid grid-cols-[52px_1fr_52px] items-center gap-2 text-[0.8rem]"
            key={dia.fecha}
          >
            <span className="text-suave">{dia.etiqueta}</span>
            <span className="block h-2.5 overflow-hidden rounded-full border border-borde bg-hondo">
              <span
                className="block h-full rounded-full bg-acento"
                style={{ width: `${(dia.kcal / maximo) * 100}%` }}
              />
            </span>
            <span className="text-right tabular-nums">{dia.kcal}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
