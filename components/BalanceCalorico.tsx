import { estadoCalorias } from "@/lib/nutricion";
import { BOTON_SECUNDARIO, TARJETA } from "@/lib/estilos";

interface Props {
  /** Kcal comidas hoy. */
  consumido: number;
  /** Objetivo diario (null si el perfil está incompleto). */
  objetivo: number | null;
  /** Macros de hoy en gramos. */
  carbos: number;
  proteinas: number;
  grasas: number;
  /** Cambia a la pestaña Perfil (para completar los datos). */
  onIrAPerfil: () => void;
}

/**
 * Héroe de la dieta: anillo con el % del objetivo, kcal consumidas
 * frente a necesarias (en grande) y desglose C/P/G del día.
 * Sin objetivo muestra un aviso para completar el perfil.
 */
export default function BalanceCalorico({
  consumido,
  objetivo,
  carbos,
  proteinas,
  grasas,
  onIrAPerfil,
}: Props) {
  if (objetivo === null) {
    return (
      <section className={TARJETA} aria-live="polite">
        <h2 className="mb-2 text-[1.15rem] font-semibold">
          ¿Cuántas calorías necesitas?
        </h2>
        <p className="m-0 text-[0.95rem] text-suave">
          Completa tu perfil (edad, estatura, peso, sexo y actividad) y aquí
          verás tus kcal necesarias frente a las que llevas hoy.
        </p>
        <button
          type="button"
          className={`${BOTON_SECUNDARIO} mt-3.5`}
          onClick={onIrAPerfil}
        >
          Completar mi perfil →
        </button>
      </section>
    );
  }

  const estado = estadoCalorias(consumido, objetivo);
  const mensaje = estado.cubierto
    ? estado.faltan === 0
      ? "Objetivo justo ✅"
      : `Objetivo cubierto ✅ (+${Math.abs(estado.faltan)})`
    : `Faltan ${estado.faltan} kcal`;

  return (
    <section
      className={`${TARJETA} text-center`}
      aria-live="polite"
      aria-label={`Hoy ${consumido} de ${objetivo} kilocalorías. ${mensaje}`}
    >
      <div
        className="mx-auto flex aspect-square w-[min(64vw,220px)] items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(#f5a524 ${estado.porcentaje}%, #0e1013 ${estado.porcentaje}%)`,
        }}
        role="img"
        aria-label={`${estado.porcentaje}% del objetivo`}
      >
        <div className="flex aspect-square w-[78%] flex-col items-center justify-center rounded-full bg-tarjeta">
          <span className="font-display text-[clamp(2.2rem,10vw,3rem)] font-bold leading-none tabular-nums text-acento">
            {consumido}
          </span>
          <span className="mt-1 text-[0.9rem] font-semibold text-suave">
            de {objetivo} kcal
          </span>
          <span className="mt-0.5 text-[0.8rem] font-bold tabular-nums">
            {estado.porcentaje}%
          </span>
        </div>
      </div>

      <p className="mt-3 mb-0 text-[1.05rem] font-semibold">{mensaje}</p>

      <div className="mt-3.5 grid grid-cols-3 gap-2.5 border-t border-dashed border-borde pt-3.5">
        <div>
          <p className="m-0 text-[1.15rem] font-bold tabular-nums">{carbos} g</p>
          <p className="mt-0.5 text-[0.78rem] text-suave">Carbos</p>
        </div>
        <div>
          <p className="m-0 text-[1.15rem] font-bold tabular-nums">{proteinas} g</p>
          <p className="mt-0.5 text-[0.78rem] text-suave">Proteínas</p>
        </div>
        <div>
          <p className="m-0 text-[1.15rem] font-bold tabular-nums">{grasas} g</p>
          <p className="mt-0.5 text-[0.78rem] text-suave">Grasas</p>
        </div>
      </div>
    </section>
  );
}
