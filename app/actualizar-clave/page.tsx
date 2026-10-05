"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { crearClienteSupabase, haySupabase } from "@/lib/supabaseCliente";
import {
  BOTON_PRINCIPAL,
  CAMPO_ENTRADA,
  ERROR,
  ETIQUETA,
  TARJETA,
} from "@/lib/estilos";

/**
 * Poner una clave nueva tras abrir el enlace del email de recuperación.
 * Supabase llega aquí con una sesión de recuperación (evento PASSWORD_RECOVERY).
 */
export default function ActualizarClave() {
  const [lista, setLista] = useState(false);
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);

  // Esperamos la sesión de recuperación que crea el enlace del email.
  useEffect(() => {
    if (!haySupabase()) return;
    const supabase = crearClienteSupabase();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setLista(true);
    });
    const { data: escucha } = supabase.auth.onAuthStateChange(
      (evento, sesion) => {
        if (evento === "PASSWORD_RECOVERY" || sesion) setLista(true);
      }
    );
    return () => {
      escucha.subscription.unsubscribe();
    };
  }, []);

  if (!haySupabase()) {
    return (
      <main className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 pt-6 pb-12">
        <section className={TARJETA}>
          <h1 className="m-0 mb-2 text-[1.3rem] font-bold">Poner clave nueva</h1>
          <p className="m-0 text-[0.9rem] text-suave">
            Falta configurar Supabase en `.env.local`. Mientras tanto todo se
            guarda en este móvil.
          </p>
          <p className="m-0 mt-3">
            <Link
              className="text-[0.9rem] font-semibold text-suave underline hover:text-acento"
              href="/diario"
            >
              ← Volver al diario
            </Link>
          </p>
        </section>
      </main>
    );
  }

  async function guardar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError("");
    setAviso("");
    setOcupado(true);
    try {
      const { error } = await crearClienteSupabase().auth.updateUser({
        password: clave,
      });
      if (error) {
        setError(error.message);
        return;
      }
      setClave("");
      setAviso("Clave actualizada. Ya puedes entrar con tu clave nueva.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 pt-6 pb-12">
      <header>
        <Link
          className="mb-2 inline-block text-[0.9rem] font-semibold text-suave no-underline hover:text-acento"
          href="/diario"
        >
          ← Diario
        </Link>
        <h1 className="m-0 mb-1.5 text-[clamp(1.5rem,5vw,2rem)] font-bold tracking-[-0.02em]">
          Poner clave nueva
        </h1>
        <p className="m-0 text-suave">
          Abre el enlace de tu email y escribe aquí tu clave nueva.
        </p>
      </header>

      <section className={TARJETA}>
        {!lista ? (
          <p className="m-0 text-[0.9rem] text-suave">
            Esperando el enlace de recuperación… Ábrelo desde tu email y esta
            página se activará sola.
          </p>
        ) : (
          <form onSubmit={guardar} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={ETIQUETA} htmlFor="clave-nueva">
                Clave nueva
              </label>
              <input
                id="clave-nueva"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                className={CAMPO_ENTRADA}
              />
            </div>
            {error && <p className={ERROR}>{error}</p>}
            {aviso && (
              <p className="m-0 rounded-[10px] border border-exito-borde bg-exito-fondo p-[10px_12px] text-[0.9rem] text-exito-texto">
                {aviso}
              </p>
            )}
            <button type="submit" className={BOTON_PRINCIPAL} disabled={ocupado}>
              {ocupado ? "Un momento…" : "Guardar clave nueva"}
            </button>
            {aviso && (
              <Link
                className="self-start text-[0.9rem] font-semibold text-suave underline hover:text-acento"
                href="/diario"
              >
                Ir al diario →
              </Link>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
