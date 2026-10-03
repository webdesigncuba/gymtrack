import { formatearFecha } from "@/lib/fechas";
import { recordsPorEjercicio } from "@/lib/estadisticas";
import {
  BOTON_MINI,
  BOTON_PELIGRO_MINI,
  TARJETA,
  TITULO,
} from "@/lib/estilos";
import type { Ejercicio, EjercicioAntiguo, Sesion, Tanda } from "@/lib/tipos";

interface Props {
  sesiones: Sesion[];
  onEliminar: (id: string) => void;
  onEditar: (id: string) => void;
  idEnEdicion: string | null;
}

// Muestra una tanda en formato corto, por ejemplo "10 reps · 60 kg".
function textoTanda(tanda: Tanda): string {
  const reps = tanda.reps ? `${tanda.reps} reps` : "— reps";
  const peso = tanda.peso ? `${tanda.peso} kg` : "— kg";
  return `${reps} · ${peso}`;
}

// Comprueba que unas tandas leídas tienen el formato nuevo.
function esListaTandas(tandas: unknown): tandas is Tanda[] {
  return (
    Array.isArray(tandas) &&
    tandas.length > 0 &&
    tandas.every((t) => typeof t === "object" && t !== null)
  );
}

// Acepta el formato nuevo (tandas: array) y el antiguo
// (tandas: "3", repeticiones, peso) para no romper sesiones guardadas antes.
function tandasDe(ejercicio: Ejercicio | EjercicioAntiguo): Tanda[] {
  const tandas = "tandas" in ejercicio ? ejercicio.tandas : undefined;
  if (esListaTandas(tandas)) return tandas;
  const texto = typeof tandas === "string" ? tandas : "";
  const cuantas = Math.max(1, parseInt(texto, 10) || 1);
  const repeticiones =
    "repeticiones" in ejercicio ? (ejercicio.repeticiones ?? "") : "";
  const peso = "peso" in ejercicio ? (ejercicio.peso ?? "") : "";
  return Array.from({ length: cuantas }, () => ({ reps: repeticiones, peso }));
}

/**
 * Lista de sesiones ordenada de la más reciente a la más antigua.
 * Recibe las sesiones ya ordenadas.
 */
export default function ListaSesiones({ sesiones, onEliminar, onEditar, idEnEdicion }: Props) {
  // Récords por nombre normalizado para marcar la tanda que los logró en último lugar.
  const records = new Map(
    recordsPorEjercicio(sesiones).map((r) => [r.nombre.toLowerCase(), r])
  );

  // Indica si una tanda ostenta el récord vigente de su ejercicio.
  function esRecord(nombre: string, peso: string, fecha: string): boolean {
    if (peso.trim() === "") return false;
    const record = records.get(nombre.trim().toLowerCase());
    return (
      record !== undefined &&
      parseFloat(peso) === record.peso &&
      fecha === record.fecha
    );
  }

  return (
    <section className={TARJETA}>
      <h2 className={TITULO}>
        Mis sesiones{" "}
        {sesiones.length > 0 && (
          <span className="rounded-full bg-acento px-2.5 py-0.5 text-[0.8rem] font-bold text-acento-texto">
            {sesiones.length}
          </span>
        )}
      </h2>

      {sesiones.length === 0 ? (
        <p className="m-0 px-0 py-3 text-center text-suave">
          Todavía no hay sesiones. ¡Registra la primera y empieza tu racha! 💪
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
          {sesiones.map((sesion) => (
            <li
              className="rounded-xl border border-borde bg-interior p-3.5"
              key={sesion.id}
            >
              <div className="mb-2.5 flex items-center justify-between gap-2.5">
                <h3 className="m-0 text-base capitalize">{formatearFecha(sesion.fecha)}</h3>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className={BOTON_MINI}
                    onClick={() => onEditar(sesion.id)}
                  >
                    {idEnEdicion === sesion.id ? "Editando…" : "Editar"}
                  </button>
                  <button
                    type="button"
                    className={BOTON_PELIGRO_MINI}
                    onClick={() => onEliminar(sesion.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {sesion.ejercicios.map((ejercicio, i) => (
                  <div key={`${sesion.id}-${i}`}>
                    <h4 className="mb-1.5 text-[0.95rem]">{ejercicio.nombre}</h4>
                    <ul className="m-0 flex list-none flex-col gap-1 p-0">
                      {tandasDe(ejercicio).map((tanda, j) => (
                        <li
                          className="flex items-center justify-between gap-2.5 rounded-lg border border-borde bg-hondo px-2.5 py-1.5 text-[0.88rem]"
                          key={`${sesion.id}-${i}-${j}`}
                        >
                          <span className="inline-block rounded-md border border-borde bg-interior px-2 py-0.5 text-[0.78rem] font-bold text-texto">
                            Tanda {j + 1}
                          </span>
                          <span>{textoTanda(tanda)}</span>
                          {esRecord(ejercicio.nombre, tanda.peso, sesion.fecha) && (
                            <span className="whitespace-nowrap rounded-full bg-acento px-2 py-0.5 text-[0.75rem] font-bold text-acento-texto">
                              PR 🏆
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
