"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { calcularRacha } from "@/lib/fechas";
import { cargarSesiones } from "@/lib/datos";
import { VERSION } from "@/lib/version";
import { BOTON_PRINCIPAL, BOTON_SECUNDARIO } from "@/lib/estilos";

/**
 * Página de bienvenida a pantalla completa.
 * Hero construido solo con CSS y SVG (sin fotos externas para que la app
 * funcione sin conexión). El botón principal lleva al diario.
 */
export default function Bienvenida() {
  const [sesiones, setSesiones] = useState(0);
  const [racha, setRacha] = useState(0);

  // Leemos los datos guardados para personalizar el mensaje.
  useEffect(() => {
    const guardadas = cargarSesiones();
    setSesiones(guardadas.length);
    setRacha(calcularRacha(guardadas.map((s) => s.fecha)));
  }, []);

  return (
    <main className="relative flex min-h-dvh items-center overflow-hidden bg-[radial-gradient(60%_45%_at_80%_15%,rgba(245,165,36,0.14),transparent_70%),repeating-linear-gradient(-45deg,transparent_0_14px,rgba(255,255,255,0.015)_14px_15px),var(--color-fondo)]">
      <div className="pointer-events-none absolute -right-10 -bottom-[30px] w-[min(80vw,480px)] opacity-[0.16]" aria-hidden="true">
        <svg viewBox="0 0 400 200" className="h-auto w-full fill-acento">
          <rect x="20" y="96" width="360" height="8" rx="4" />
          <rect x="60" y="60" width="18" height="80" rx="4" />
          <rect x="82" y="70" width="14" height="60" rx="4" />
          <rect x="322" y="60" width="18" height="80" rx="4" />
          <rect x="304" y="70" width="14" height="60" rx="4" />
        </svg>
      </div>

      <div className="relative mx-auto flex w-full max-w-[640px] flex-col gap-3.5 px-5 py-12">
        <p className="m-0 font-bold text-acento">GymTrack</p>
        <h1 className="m-0 font-display text-[clamp(2.6rem,11vw,4.5rem)] font-bold leading-[1.02] tracking-[0.01em]">
          Entrena. Apunta. Progresa.
        </h1>
        <p className="m-0 max-w-[44ch] text-[1.05rem] text-suave">
          Registra tus sesiones con sus tandas, descansa con el cronómetro
          y mantén viva tu racha de días seguidos.
        </p>

        {racha > 0 && (
          <p className="m-0 font-bold text-acento">
            Llevas {racha} {racha === 1 ? "día seguido 🔥" : "días seguidos 🔥"}
          </p>
        )}

        <div className="mt-2 flex flex-wrap gap-2.5">
          <Link
            className={`${BOTON_PRINCIPAL} inline-flex items-center justify-center no-underline`}
            href="/diario"
          >
            Empezar a entrenar
          </Link>
          {sesiones > 0 && (
            <Link
              className={`${BOTON_SECUNDARIO} inline-flex items-center justify-center no-underline`}
              href="/diario"
            >
              Ver mis {sesiones} {sesiones === 1 ? "sesión" : "sesiones"}
            </Link>
          )}
        </div>

        <p className="mt-3 text-[0.8rem] text-suave">v{VERSION}</p>
      </div>
    </main>
  );
}
