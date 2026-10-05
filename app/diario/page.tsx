"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FormularioSesion from "@/components/FormularioSesion";
import BalanceCalorico from "@/components/BalanceCalorico";
import FormularioDieta from "@/components/FormularioDieta";
import ListaComidas from "@/components/ListaComidas";
import ProgresoDieta from "@/components/ProgresoDieta";
import FormularioPerfil from "@/components/Perfil";
import { caloriasNecesarias } from "@/lib/nutricion";
import ListaSesiones from "@/components/ListaSesiones";
import CronometroDescanso from "@/components/CronometroDescanso";
import Estadisticas from "@/components/Estadisticas";
import Respaldo from "@/components/Respaldo";
import Auth from "@/components/Auth";
import { calcularRacha, hoyISO } from "@/lib/fechas";
import { guardarSesiones, ordenarSesiones } from "@/lib/datos";
import {
  backendLocalComidas,
  guardarComidas,
  totalesDelDia,
  type BackendComidas,
} from "@/lib/alimentos";
import {
  backendLocalPerfil,
  guardarPerfil,
  type BackendPerfil,
} from "@/lib/perfil";
import {
  backendLocalAlimentos,
  guardarAlimentosCustom,
  type BackendAlimentos,
} from "@/lib/alimentosCustom";
import { almacenLocal, limpiarCacheLocal, type Almacen } from "@/lib/almacen";
import { almacenNube, backendNubeAlimentos, backendNubeComidas, backendNubePerfil, backendNubePlantillas } from "@/lib/almacenNube";
import {
  backendLocalPlantillas,
  guardarPlantillas,
  type BackendPlantillas,
} from "@/lib/plantillas";
import { crearClienteSupabase, haySupabase } from "@/lib/supabaseCliente";
import type { Comida, Perfil, Sesion } from "@/lib/tipos";
// Pestañas del diario: cada una agrupa tarjetas existentes sin tocar su lógica.
type Pestana = "registrar" | "sesiones" | "dieta" | "perfil" | "progreso" | "respaldo";

const PESTANAS: { id: Pestana; etiqueta: string }[] = [
  { id: "registrar", etiqueta: "Registrar" },
  { id: "sesiones", etiqueta: "Sesiones" },
  { id: "dieta", etiqueta: "Dieta" },
  { id: "perfil", etiqueta: "Perfil" },
  { id: "progreso", etiqueta: "Progreso" },
  { id: "respaldo", etiqueta: "Respaldo" },
];

export default function Pagina() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(true);
  // Id de la sesión que se está editando (null = registrando una nueva).
  const [idEnEdicion, setIdEnEdicion] = useState<string | null>(null);
  // Señal para el cronómetro: cambia cada vez que se añade una tanda.
  const [senalDescanso, setSenalDescanso] = useState(0);
  // Señal para recargar plantillas cuando el respaldo restaura unas nuevas.
  const [senalPlantillas, setSenalPlantillas] = useState(0);
  // Señal para recargar mis alimentos cuando el respaldo restaura unos nuevos.
  const [senalAlimentos, setSenalAlimentos] = useState(0);
  // Usuario logueado (null = anónimo, todo en local).
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [cuentaEmail, setCuentaEmail] = useState<string | null>(null);
  // Comidas de la dieta (varias por día, por cuenta).
  const [comidas, setComidas] = useState<Comida[]>([]);
  const [cargandoComidas, setCargandoComidas] = useState(true);
  // Perfil del usuario (uno por cuenta, para uso posterior).
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);

  // Almacén activo: nube si hay sesión, local si no.
  const almacen: Almacen = useMemo(() => {
    if (usuarioId && haySupabase()) {
      return almacenNube(crearClienteSupabase(), usuarioId);
    }
    return almacenLocal;
  }, [usuarioId]);

  // Fuente de plantillas: con login escribe en la nube y deja copia local
  // (espejo); sin login usa solo el local.
  const backendPlantillas: BackendPlantillas = useMemo(() => {
    if (usuarioId && haySupabase()) {
      const nube = backendNubePlantillas(crearClienteSupabase(), usuarioId);
      return {
        cargar: nube.cargar,
        guardar: async (plantillas) => {
          await nube.guardar(plantillas);
          guardarPlantillas(plantillas);
        },
      };
    }
    return backendLocalPlantillas;
  }, [usuarioId]);

  // Fuente de comidas: con login escribe en la nube y deja copia local
  // (espejo); sin login usa solo el local.
  const backendComidas: BackendComidas = useMemo(() => {
    if (usuarioId && haySupabase()) {
      const nube = backendNubeComidas(crearClienteSupabase(), usuarioId);
      return {
        cargar: nube.cargar,
        guardar: async (lista) => {
          await nube.guardar(lista);
          guardarComidas(lista);
        },
      };
    }
    return backendLocalComidas;
  }, [usuarioId]);

  // Fuente de perfil: con login escribe en la nube y deja copia local
  // (espejo); sin login usa solo el local.
  const backendPerfil: BackendPerfil = useMemo(() => {
    if (usuarioId && haySupabase()) {
      const nube = backendNubePerfil(crearClienteSupabase(), usuarioId);
      return {
        cargar: nube.cargar,
        guardar: async (datos) => {
          await nube.guardar(datos);
          guardarPerfil(datos);
        },
      };
    }
    return backendLocalPerfil;
  }, [usuarioId]);

  // Fuente de mis alimentos: con login escribe en la nube y deja copia local
  // (espejo); sin login usa solo el local.
  const backendAlimentos: BackendAlimentos = useMemo(() => {
    if (usuarioId && haySupabase()) {
      const nube = backendNubeAlimentos(crearClienteSupabase(), usuarioId);
      return {
        cargar: nube.cargar,
        guardar: async (lista) => {
          await nube.guardar(lista);
          guardarAlimentosCustom(lista);
        },
      };
    }
    return backendLocalAlimentos;
  }, [usuarioId]);

  // 1) Al montar o cambiar de almacén, cargamos lo que haya guardado.
  useEffect(() => {
    let vivo = true;
    setCargando(true);
    almacen
      .cargar()
      .then((guardadas) => {
        if (vivo) setSesiones(guardadas);
      })
      .catch((error) => {
        console.warn("No se pudieron cargar las sesiones:", error);
        if (vivo) setSesiones([]);
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [almacen]);

  // 2) Cada vez que cambian las sesiones, las guardamos en el almacén
  // activo. Con login, además dejamos copia en local (espejo).
  useEffect(() => {
    if (cargando) return;
    almacen
      .guardar(sesiones)
      .then(() => {
        if (usuarioId) guardarSesiones(sesiones);
      })
      .catch((error) => {
        console.warn("No se pudieron guardar las sesiones:", error);
      });
  }, [sesiones, cargando, almacen, usuarioId]);
  // Comidas: se cargan al cambiar de backend y se guardan en cada cambio
  // (con espejo local si hay login). Flag propio para no sobrescribir
  // antes de cargar.
  useEffect(() => {
    let vivo = true;
    setCargandoComidas(true);
    backendComidas
      .cargar()
      .then((guardadas) => {
        if (vivo) setComidas(guardadas);
      })
      .catch((error) => {
        console.warn("No se pudieron cargar las comidas:", error);
        if (vivo) setComidas([]);
      })
      .finally(() => {
        if (vivo) setCargandoComidas(false);
      });
    return () => {
      vivo = false;
    };
  }, [backendComidas]);

  useEffect(() => {
    if (cargandoComidas) return;
    backendComidas.guardar(comidas).catch((error) => {
      console.warn("No se pudieron guardar las comidas:", error);
    });
  }, [comidas, cargandoComidas, backendComidas]);
  // Perfil: se carga al cambiar de backend y se guarda en cada cambio.
  useEffect(() => {
    let vivo = true;
    setCargandoPerfil(true);
    backendPerfil
      .cargar()
      .then((guardado) => {
        if (vivo) setPerfil(guardado);
      })
      .catch((error) => {
        console.warn("No se pudo cargar el perfil:", error);
        if (vivo) setPerfil(null);
      })
      .finally(() => {
        if (vivo) setCargandoPerfil(false);
      });
    return () => {
      vivo = false;
    };
  }, [backendPerfil]);

  useEffect(() => {
    if (cargandoPerfil) return;
    if (perfil === null) return;
    backendPerfil.guardar(perfil).catch((error) => {
      console.warn("No se pudo guardar el perfil:", error);
    });
  }, [perfil, cargandoPerfil, backendPerfil]);
  // Pestaña visible (lo demás sigue montado pero oculto para no perder
  // el estado del formulario ni detener el cronómetro).
  const [pestana, setPestana] = useState<Pestana>("registrar");

  const racha = useMemo(
    () => calcularRacha(sesiones.map((s) => s.fecha)),
    [sesiones]
  );

  const entrenoHoy = sesiones.some((s) => s.fecha === hoyISO());
  const sesionesOrdenadas = useMemo(() => ordenarSesiones(sesiones), [sesiones]);
  const sesionEnEdicion = sesiones.find((s) => s.id === idEnEdicion) ?? null;

  function guardarSesion(datos: Sesion): void {
    if (idEnEdicion) {
      // Estamos editando: no puede quedarse con la fecha de otra sesión.
      const choca = sesiones.some(
        (s) => s.id !== idEnEdicion && s.fecha === datos.fecha
      );
      if (choca) return;
      setSesiones((prev) =>
        prev.map((s) => (s.id === idEnEdicion ? { ...datos, id: idEnEdicion } : s))
      );
      setIdEnEdicion(null);
      return;
    }
    // Defensa extra: aunque el formulario ya lo valida, no guardamos
    // una segunda sesión para un día que ya tiene una.
    setSesiones((prev) =>
      prev.some((s) => s.fecha === datos.fecha) ? prev : [datos, ...prev]
    );
  }

  function iniciarEdicion(id: string): void {
    setIdEnEdicion(id);
    setPestana("registrar");
    // Esperamos a que la pestaña se muestre antes de subir al formulario.
    setTimeout(() => {
      document
        .getElementById("formulario-sesion")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function cancelarEdicion(): void {
    setIdEnEdicion(null);
  }

  // Al entrar o salir de la cuenta cambiamos de almacén (los efectos recargan).
  // Al salir, además borramos la caché local con los datos del usuario.
  function cambiarSesion(id: string | null, email: string | null = null): void {
    if (id === null) limpiarCacheLocal();
    setIdEnEdicion(null);
    setUsuarioId(id);
    setCuentaEmail(email);
  }

  // Login obligatorio: sin sesión no se muestra el diario.
  // Sin Supabase configurado, Auth explica cómo configurarlo.
  if (!haySupabase() || !usuarioId) {
    return (
      <main className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 pt-6 pb-12">
        <header>
          <Link
            className="mb-2 inline-block text-[0.9rem] font-semibold text-suave no-underline hover:text-acento"
            href="/"
          >
            ← Inicio
          </Link>
          <h1 className="m-0 mb-1.5 text-[clamp(1.5rem,5vw,2rem)] font-bold tracking-[-0.02em]">
            Diario de seguimiento de ejercicios
          </h1>
          <p className="m-0 text-suave">
            Entra con tu cuenta para ver tus sesiones.
          </p>
        </header>

        <Auth onSesion={cambiarSesion} />
      </main>
    );
  }

  function eliminarSesion(id: string): void {
    const sesion = sesiones.find((s) => s.id === id);
    const texto = sesion ? `¿Eliminar la sesión del ${sesion.fecha}?` : "¿Eliminar la sesión?";
    if (!window.confirm(texto)) return;
    if (id === idEnEdicion) setIdEnEdicion(null);
    setSesiones((prev) => prev.filter((s) => s.id !== id));
  }

  function importarSesiones(restauradas: Sesion[]): void {
    // El respaldo reemplaza todo lo actual (ya confirmado en el componente).
    setIdEnEdicion(null);
    setSesiones(restauradas);
  }

  function importarComidas(restauradas: Comida[]): void {
    // El respaldo reemplaza toda la dieta (ya confirmado en el componente).
    setComidas(restauradas);
  }

  function importarPerfil(restaurado: Perfil | null): void {
    // El respaldo reemplaza el perfil (ya confirmado en el componente).
    setPerfil(restaurado);
  }

  function guardarDatosPerfil(datos: Perfil): void {
    setPerfil(datos);
  }

  function guardarComida(comida: Comida): void {
    // Varias comidas por día: siempre se añade una nueva.
    setComidas((prev) => [comida, ...prev]);
  }

  function eliminarComida(id: string): void {
    const comida = comidas.find((c) => c.id === id);
    const texto = comida
      ? `¿Eliminar "${comida.nombre}" (${comida.gramos} g) del ${comida.fecha}?`
      : "¿Eliminar la comida?";
    if (!window.confirm(texto)) return;
    setComidas((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 pt-6 pb-12">
      <header>
        <Link
          className="mb-2 inline-block text-[0.9rem] font-semibold text-suave no-underline hover:text-acento"
          href="/"
        >
          ← Inicio
        </Link>
        <h1 className="m-0 mb-1.5 text-[clamp(1.5rem,5vw,2rem)] font-bold tracking-[-0.02em]">
          Diario de seguimiento de ejercicios
        </h1>
        <p className="m-0 text-suave">
          Registra tus sesiones en el gimnasio y no pierdas tu racha.
        </p>
      </header>

      <Auth onSesion={cambiarSesion} />

      <nav
        className="sticky top-0 z-40 grid grid-cols-6 gap-1.5 bg-fondo py-2.5"
        role="tablist"
        aria-label="Secciones del diario"
      >
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pestana === p.id}
            onClick={() => setPestana(p.id)}
            className={
              pestana === p.id
                ? "min-h-11 cursor-pointer rounded-full border border-acento bg-acento text-[0.85rem] font-bold text-acento-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
                : "min-h-11 cursor-pointer rounded-full border border-borde bg-tarjeta text-[0.85rem] font-bold text-suave transition-colors hover:text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
            }
          >
            {p.etiqueta}
          </button>
        ))}
      </nav>

      <div role="tabpanel" hidden={pestana !== "registrar"} aria-label="Registrar">
        <div className="flex flex-col gap-5">
          <CronometroDescanso senalInicio={senalDescanso} />

          <FormularioSesion
            onGuardar={guardarSesion}
            fechasOcupadas={sesiones.map((s) => s.fecha)}
            sesionEnEdicion={sesionEnEdicion}
            sesiones={sesiones}
            senalPlantillas={senalPlantillas}
            backendPlantillas={backendPlantillas}
            onCancelar={cancelarEdicion}
            onAñadirTanda={() => setSenalDescanso((n) => n + 1)}
          />
        </div>
      </div>

      <div role="tabpanel" hidden={pestana !== "sesiones"} aria-label="Sesiones">
        <ListaSesiones
          sesiones={sesionesOrdenadas}
          onEliminar={eliminarSesion}
          onEditar={iniciarEdicion}
          idEnEdicion={idEnEdicion}
        />
      </div>

      <div role="tabpanel" hidden={pestana !== "dieta"} aria-label="Dieta">
        <div className="flex flex-col gap-5">
          {(() => {
            const totalesHoy = totalesDelDia(comidas, hoyISO());
            return (
              <BalanceCalorico
                consumido={totalesHoy.kcal}
                objetivo={caloriasNecesarias(perfil)?.objetivo ?? null}
                carbos={totalesHoy.carbos}
                proteinas={totalesHoy.proteinas}
                grasas={totalesHoy.grasas}
                onIrAPerfil={() => setPestana("perfil")}
              />
            );
          })()}

          <FormularioDieta
            onGuardar={guardarComida}
            backendAlimentos={backendAlimentos}
            senalAlimentos={senalAlimentos}
          />

          <ListaComidas comidas={comidas} onEliminar={eliminarComida} />

          <ProgresoDieta comidas={comidas} />
        </div>
      </div>

      <div role="tabpanel" hidden={pestana !== "perfil"} aria-label="Perfil">
        <FormularioPerfil perfil={perfil} onGuardar={guardarDatosPerfil} />
      </div>

      <div role="tabpanel" hidden={pestana !== "progreso"} aria-label="Progreso">
        <div className="flex flex-col gap-5">
          <section
            className="rounded-2xl border border-borde bg-tarjeta p-6 text-center shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
            aria-live="polite"
          >
            {cargando ? (
              <p className="m-0 text-suave">Cargando…</p>
            ) : (
              <>
                <span className="block font-display text-[clamp(3.5rem,16vw,5rem)] font-bold leading-none tracking-[0.01em] tabular-nums text-acento [text-shadow:0_0_26px_rgba(245,165,36,0.35)]">
                  {racha}
                </span>
                <span className="mt-1 block text-[1.1rem] font-semibold">
                  {racha === 1 ? "día seguido 🔥" : "días seguidos 🔥"}
                </span>
                <p className="mt-2.5 text-[0.95rem] text-suave">
                  {!entrenoHoy && racha > 0
                    ? "Tu racha sigue viva: ¡hoy aún puedes entrenar!"
                    : entrenoHoy
                      ? "¡Sesión de hoy registrada! Sigue así."
                      : "Empieza hoy tu racha entrenando."}
                </p>
              </>
            )}
          </section>

          <Estadisticas sesiones={sesiones} />
        </div>
      </div>

      <div role="tabpanel" hidden={pestana !== "respaldo"} aria-label="Respaldo">
        <Respaldo
        sesiones={sesiones}
        onImportar={importarSesiones}
        onImportarPlantillas={() => setSenalPlantillas((n) => n + 1)}
        backendPlantillas={backendPlantillas}
        usuarioEmail={cuentaEmail}
        comidas={comidas}
        backendComidas={backendComidas}
        onImportarComidas={importarComidas}
        perfil={perfil}
        backendPerfil={backendPerfil}
        onImportarPerfil={importarPerfil}
        backendAlimentos={backendAlimentos}
        onImportarAlimentos={() => setSenalAlimentos((n) => n + 1)}
      />
      </div>
    </main>
  );
}
