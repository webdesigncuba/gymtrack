"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { crearClienteSupabase, haySupabase } from "@/lib/supabaseCliente";
import {
  BOTON_PRINCIPAL,
  BOTON_SECUNDARIO,
  CAMPO_ENTRADA,
  ETIQUETA,
  ERROR,
  TARJETA,
  TITULO,
} from "@/lib/estilos";

interface Props {
  onSesion: (userId: string | null, email?: string | null) => void;
}

/**
 * Cuenta: entrar, crear cuenta o salir con email y contraseña.
 * Sin configuración de Supabase muestra un aviso y la app sigue en local.
 */
export default function Auth({ onSesion }: Props) {
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [crear, setCrear] = useState(false);
  const [cuenta, setCuenta] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);

  // Al montar, recuperamos la sesión guardada en el navegador.
  useEffect(() => {
    if (!haySupabase()) return;
    const supabase = crearClienteSupabase();
    supabase.auth.getSession().then(({ data }) => {
      const id = data.session?.user.id ?? null;
      setCuenta(data.session?.user.email ?? null);
      onSesion(id, data.session?.user.email ?? null);
    });
    const { data: escucha } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      setCuenta(sesion?.user.email ?? null);
      onSesion(sesion?.user.id ?? null, sesion?.user.email ?? null);
    });
    return () => {
      escucha.subscription.unsubscribe();
    };
    // Solo al montar: el aviso al padre lo repite cada cambio de sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!haySupabase()) {
    return (
      <section className={TARJETA}>
        <h2 className={TITULO}>Cuenta</h2>
        <p className="m-0 text-[0.8rem] text-suave">
          Copia `.env.example` a `.env.local` con tus datos de Supabase para
          entrar con cuenta. Mientras tanto todo se guarda en este móvil.
        </p>
      </section>
    );
  }

  async function enviar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError("");
    setAviso("");
    setOcupado(true);
    try {
      const supabase = crearClienteSupabase();
      if (crear === true) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: clave,
        });
        if (error) {
          setError(error.message);
          return;
        }
        // Sin sesión no hay entrada: el email debe confirmarse primero
        // (si el proyecto no exige confirmación, la sesión ya viene creada).
        if (!data.session) {
          setCrear(false);
          setClave("");
          setAviso(
            "Cuenta creada. Revisa tu email y confirma la cuenta antes de entrar."
          );
        }
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: clave,
      });
      if (error) setError(error.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar.");
    } finally {
      setOcupado(false);
    }
  }

  async function salir(): Promise<void> {
    await crearClienteSupabase().auth.signOut();
  }

  if (cuenta) {
    return (
      <section className={TARJETA}>
        <div className="flex items-center justify-between gap-2.5">
          <p className="m-0 text-[0.9rem]">
            Sesión de <strong>{cuenta}</strong> (nube ☁️)
          </p>
          <button type="button" className={BOTON_SECUNDARIO} onClick={salir}>
            Salir
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={TARJETA}>
      <h2 className={TITULO}>Cuenta</h2>
      <form onSubmit={enviar} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={ETIQUETA} htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CAMPO_ENTRADA}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={ETIQUETA} htmlFor="auth-clave">Contraseña</label>
          <input
            id="auth-clave"
            type="password"
            required
            minLength={6}
            autoComplete={crear ? "new-password" : "current-password"}
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
          {ocupado ? "Un momento…" : crear ? "Crear cuenta" : "Entrar"}
        </button>
        <button
          type="button"
          className="cursor-pointer self-start bg-transparent p-0 text-[0.85rem] font-semibold text-suave underline hover:text-acento"
          onClick={() => {
            setCrear(!crear);
            setError("");
            setAviso("");
          }}
        >
          {crear ? "Ya tengo cuenta: entrar" : "No tengo cuenta: crear una"}
        </button>
      </form>
    </section>
  );
}
