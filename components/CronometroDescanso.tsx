"use client";

import { useEffect, useRef, useState } from "react";
import {
  BOTON_PRINCIPAL,
  BOTON_SECUNDARIO,
  CAMPO_ENTRADA,
  ETIQUETA,
  PISTA,
  TARJETA,
  TITULO,
} from "@/lib/estilos";

// Duraciones rápidas disponibles (en segundos).
const PRESTABLECIDAS = [60, 90, 120];
// Duración seleccionada por defecto.
const POR_DEFECTO = 90;

// Estados posibles del cronómetro.
type Estado = "listo" | "corriendo" | "pausado" | "terminado";

interface Props {
  senalInicio?: number;
}

// Pita 3 veces con WebAudio. Falla en silencio si el navegador lo bloquea.
function sonarAviso(): void {
  try {
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioContexto = w.AudioContext ?? w.webkitAudioContext;
    if (!AudioContexto) return;
    const contexto = new AudioContexto();
    [0, 350, 700].forEach((retraso) => {
      const oscilador = contexto.createOscillator();
      const ganancia = contexto.createGain();
      oscilador.connect(ganancia);
      ganancia.connect(contexto.destination);
      oscilador.type = "sine";
      oscilador.frequency.value = 880;
      const inicio = contexto.currentTime + retraso / 1000;
      oscilador.start(inicio);
      oscilador.stop(inicio + 0.25);
    });
  } catch (error) {
    console.warn("No se pudo reproducir el aviso:", error);
  }
}

// Convierte segundos en texto "m:ss", por ejemplo 90 -> "1:30".
function formatear(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = String(segundos % 60).padStart(2, "0");
  return `${minutos}:${resto}`;
}

/**
 * Cronómetro de descanso entre tandas.
 * - `senalInicio`: número que cambia cada vez que se añade una tanda en el
 *   formulario; al cambiar, el cronómetro arranca solo con la duración elegida.
 * - En reposo muestra una tarjeta para elegir duración. Al activarse aparece
 *   como un modal en el centro que no deja trabajar en el sistema hasta que
 *   termina (botón Entendido). Mientras cuenta no se puede cambiar la
 *   duración: solo pausar y reanudar.
 */
export default function CronometroDescanso({ senalInicio = 0 }: Props) {
  const [duracion, setDuracion] = useState(POR_DEFECTO);
  const [restantes, setRestantes] = useState(POR_DEFECTO);
  const [estado, setEstado] = useState<Estado>("listo");

  // Guardamos el intervalo y la hora de fin para que el conteo no se desfase.
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finRef = useRef(0);

  // El modal está abierto siempre que el cronómetro no está en reposo.
  const modalAbierto = estado !== "listo";

  function detenerIntervalo(): void {
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
  }

  // Arranca (o rearranca) el conteo con los segundos indicados.
  function iniciar(segundos: number): void {
    detenerIntervalo();
    finRef.current = Date.now() + segundos * 1000;
    setRestantes(segundos);
    setEstado("corriendo");
    intervaloRef.current = setInterval(() => {
      const queQuedan = Math.max(0, Math.ceil((finRef.current - Date.now()) / 1000));
      setRestantes(queQuedan);
      if (queQuedan <= 0) {
        detenerIntervalo();
        setEstado("terminado");
        sonarAviso();
        try {
          navigator.vibrate?.(200);
        } catch (error) {
          console.warn("No se pudo vibrar:", error);
        }
      }
    }, 250);
  }

  // Última señal procesada: solo arranca cuando cambia de verdad.
  // Comparar valores (en vez de una bandera de "primer render") evita
  // arranques falsos cuando React ejecuta los efectos dos veces en
  // desarrollo (modo estricto).
  const senalAnterior = useRef(senalInicio);

  // Cada vez que el formulario añade una tanda, arranca solo.
  useEffect(() => {
    if (senalInicio === senalAnterior.current) return;
    senalAnterior.current = senalInicio;
    iniciar(duracion);
    // Solo depende de la señal: la duración se lee al arrancar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [senalInicio]);

  // Limpiamos el intervalo si el componente desaparece.
  useEffect(() => {
    return () => detenerIntervalo();
  }, []);

  // Mientras el modal está abierto, bloqueamos el scroll de la página
  // para que no se pueda trabajar en el sistema por detrás.
  useEffect(() => {
    if (!modalAbierto) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [modalAbierto]);

  function pausar(): void {
    const queQuedan = Math.max(0, Math.ceil((finRef.current - Date.now()) / 1000));
    detenerIntervalo();
    setRestantes(queQuedan);
    setEstado("pausado");
  }

  function reanudar(): void {
    iniciar(restantes);
  }

  function cerrar(): void {
    setEstado("listo");
    setRestantes(duracion);
  }

  function cambiarDuracion(segundos: number): void {
    setDuracion(segundos);
    setRestantes(segundos);
  }

  return (
    <>
      <section className={TARJETA} aria-live="polite">
        <h2 className={TITULO}>Descanso ⏱️</h2>

        <p className="mb-3 text-center font-display text-[clamp(2.5rem,10vw,3.5rem)] font-semibold leading-none tabular-nums text-acento [text-shadow:0_0_22px_rgba(245,165,36,0.3)]">
          {formatear(restantes)}
        </p>

        <div className="mb-3 flex gap-2">
          {PRESTABLECIDAS.map((segundos) => (
            <button
              key={segundos}
              type="button"
              className={
                duracion === segundos
                  ? `${BOTON_SECUNDARIO} flex-1 border-2 border-acento bg-[rgba(245,165,36,0.15)] text-acento`
                  : `${BOTON_SECUNDARIO} flex-1`
              }
              onClick={() => cambiarDuracion(segundos)}
            >
              {segundos} s
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={ETIQUETA} htmlFor="descanso-personalizado">Otro tiempo (segundos)</label>
          <input
            id="descanso-personalizado"
            type="number"
            min="5"
            inputMode="numeric"
            value={duracion}
            onChange={(e) => cambiarDuracion(Number(e.target.value) || 0)}
            className={CAMPO_ENTRADA}
          />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className={`${BOTON_PRINCIPAL} flex-1`}
            onClick={() => iniciar(duracion)}
          >
            Iniciar
          </button>
        </div>

        <p className={PISTA}>
          Se abre solo cada vez que añades una tanda en el formulario.
        </p>
      </section>

      {modalAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(8,9,11,0.82)] p-4">
          <div
            className="flex w-[min(92vw,380px)] flex-col gap-2 rounded-2xl border border-borde bg-tarjeta p-7 text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)] anim-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Cronómetro de descanso"
          >
            {estado === "terminado" ? (
              <div className="flex flex-col gap-2 text-center">
                <p className="m-0 text-center font-display text-[clamp(3.5rem,18vw,5rem)] font-semibold leading-none tabular-nums text-acento [text-shadow:0_0_22px_rgba(245,165,36,0.3)]">
                  ¡Descanso terminado!
                </p>
                <p className={PISTA}>
                  Toca Entendido para seguir con tu entrenamiento.
                </p>
                <button
                  type="button"
                  className={BOTON_PRINCIPAL}
                  onClick={cerrar}
                >
                  Entendido
                </button>
              </div>
            ) : (
              <>
                <h2 className={`${TITULO} justify-center`}>Descanso ⏱️</h2>
                <p className="m-0 text-center font-display text-[clamp(3.5rem,18vw,5rem)] font-semibold leading-none tabular-nums text-acento [text-shadow:0_0_22px_rgba(245,165,36,0.3)]">
                  {formatear(restantes)}
                </p>
                <p className={PISTA}>
                  {estado === "pausado" ? "En pausa" : "Respira… ya casi toca la siguiente tanda."}
                </p>
                <div className="mt-3 flex gap-2">
                  {estado === "corriendo" ? (
                    <button
                      type="button"
                      className={`${BOTON_SECUNDARIO} flex-1`}
                      onClick={pausar}
                    >
                      Pausar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${BOTON_PRINCIPAL} flex-1`}
                      onClick={reanudar}
                    >
                      Reanudar
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
