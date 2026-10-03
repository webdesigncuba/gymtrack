"use client";

import { useRef, useState } from "react";
import { hoyISO } from "@/lib/fechas";
import {
  backendLocalComidas,
  type BackendComidas,
} from "@/lib/alimentos";
import { backendLocalPerfil, type BackendPerfil } from "@/lib/perfil";
import {
  backendLocalPlantillas,
  type BackendPlantillas,
} from "@/lib/plantillas";
import { construirRespaldo, leerRespaldo } from "@/lib/respaldo";
import type { Comida, Perfil, Sesion } from "@/lib/tipos";

interface Props {
  sesiones: Sesion[];
  onImportar: (sesiones: Sesion[]) => void;
  onImportarPlantillas: () => void;
  backendPlantillas?: BackendPlantillas;
  usuarioEmail?: string | null;
  comidas?: Comida[];
  backendComidas?: BackendComidas;
  onImportarComidas?: (comidas: Comida[]) => void;
  perfil?: Perfil | null;
  backendPerfil?: BackendPerfil;
  onImportarPerfil?: (perfil: Perfil | null) => void;
}

/**
 * Respaldo en un solo JSON versionado: { version: 3, sesiones, plantillas, comidas, perfil }.
 * - Descargar: guarda sesiones, plantillas, comidas y perfil en un archivo.
 * - Restaurar: valida cada clave por separado y reemplaza (con confirmación).
 * Los respaldos v2/v1 (sin perfil) se leen igual: solo no tocan el perfil.
 */
export default function Respaldo({
  sesiones,
  onImportar,
  onImportarPlantillas,
  backendPlantillas = backendLocalPlantillas,
  usuarioEmail = null,
  comidas = [],
  backendComidas = backendLocalComidas,
  onImportarComidas = () => {},
  perfil = null,
  backendPerfil = backendLocalPerfil,
  onImportarPerfil = () => {},
}: Props) {
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Botón secundario en acero (misma apariencia que `.boton-secundario`).
  const boton =
    "min-h-11 cursor-pointer rounded-[10px] border border-borde bg-transparent px-3.5 py-2.5 text-[0.95rem] font-semibold text-texto transition-colors hover:bg-interior";

  function avisar(texto: string, error: boolean): void {
    setMensaje(texto);
    setEsError(error);
  }

  async function descargar(): Promise<void> {
    const plantillas = await backendPlantillas.cargar().catch((error) => {
      console.warn("No se pudieron leer las plantillas:", error);
      return [];
    });
    const comidasGuardadas = await backendComidas.cargar().catch((error) => {
      console.warn("No se pudieron leer las comidas:", error);
      return [];
    });
    // Si el diario ya trae las comidas en memoria, esas mandan.
    const comidasTotales = comidas.length > 0 ? comidas : comidasGuardadas;
    const perfilGuardado = await backendPerfil.cargar().catch((error) => {
      console.warn("No se pudo leer el perfil:", error);
      return null;
    });
    // Si el diario ya trae el perfil en memoria, ese manda.
    const perfilTotal = perfil ?? perfilGuardado;
    if (sesiones.length === 0 && plantillas.length === 0 && comidasTotales.length === 0 && perfilTotal === null) {
      avisar("No hay sesiones, plantillas, comidas ni perfil para respaldar.", true);
      return;
    }
    const contenido = JSON.stringify(
      construirRespaldo(sesiones, plantillas, usuarioEmail, comidasTotales, perfilTotal),
      null,
      2
    );
    const archivo = new Blob([contenido], { type: "application/json" });
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `gymtrack-respaldo-${hoyISO()}.json`;
    enlace.click();
    URL.revokeObjectURL(url);
    avisar(
      `Respaldo descargado con ${resumir(sesiones.length, "sesión", "sesiones")}, ${resumir(plantillas.length, "plantilla", "plantillas")}, ${resumir(comidasTotales.length, "comida", "comidas")}${perfilTotal ? " y perfil" : ""}.`,
      false
    );
  }

  // Texto corto con conteo, p. ej. "3 sesiones" o "1 plantilla".
  function resumir(cantidad: number, singular: string, plural: string): string {
    return `${cantidad} ${cantidad === 1 ? singular : plural}`;
  }

  async function restaurar(evento: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const archivo = evento.target.files?.[0];
    // Limpiamos el input para poder elegir el mismo archivo otra vez.
    evento.target.value = "";
    if (!archivo) return;

    let datos: unknown;
    try {
      datos = JSON.parse(await archivo.text());
    } catch (error) {
      console.warn("El archivo no es un JSON válido:", error);
      avisar("El archivo no es un respaldo válido.", true);
      return;
    }

    const leido = leerRespaldo(datos);
    if (!leido) {
      avisar("El archivo no es un respaldo válido.", true);
      return;
    }

    const partes = [resumir(leido.sesiones.length, "sesión", "sesiones")];
    if (leido.conPlantillas) {
      partes.push(resumir(leido.plantillas.length, "plantilla", "plantillas"));
    }
    if (leido.conComidas) {
      partes.push(resumir(leido.comidas.length, "comida", "comidas"));
    }
    if (leido.conPerfil) {
      partes.push("perfil");
    }
    const descartes: string[] = [];
    if (leido.descartadasSesiones > 0) {
      descartes.push(`${leido.descartadasSesiones} sesiones descartadas por formato inválido`);
    }
    if (leido.descartadasPlantillas > 0) {
      descartes.push(`${leido.descartadasPlantillas} plantillas descartadas por formato inválido`);
    }
    if (leido.descartadasComidas > 0) {
      descartes.push(`${leido.descartadasComidas} comidas descartadas por formato inválido`);
    }
    const extra = descartes.length > 0 ? ` (${descartes.join(", ")})` : "";
    if (!window.confirm(`¿Reemplazar lo actual por ${partes.join(", ")} del respaldo?${extra}`)) return;
    onImportar(leido.sesiones);
    if (leido.conPlantillas) {
      await backendPlantillas.guardar(leido.plantillas).catch((error) => {
        console.warn("No se pudieron restaurar las plantillas:", error);
      });
      onImportarPlantillas();
    }
    if (leido.conComidas) {
      await backendComidas.guardar(leido.comidas).catch((error) => {
        console.warn("No se pudieron restaurar las comidas:", error);
      });
      onImportarComidas(leido.comidas);
    }
    if (leido.conPerfil) {
      const perfilLeido = leido.perfil;
      if (perfilLeido) {
        await backendPerfil.guardar(perfilLeido).catch((error) => {
          console.warn("No se pudo restaurar el perfil:", error);
        });
      }
      onImportarPerfil(perfilLeido);
    }
    avisar(`Respaldo restaurado con ${partes.join(", ")}.${extra}`, false);
  }

  return (
    <section className="rounded-2xl border border-borde bg-tarjeta p-5 shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
      <h2 className="mb-4 flex items-center gap-2 text-[1.15rem] font-semibold">
        Respaldo
      </h2>
      <p className="m-0 text-[0.8rem] text-suave">
        Guarda tus sesiones en un archivo para no perderlas si borras los datos del navegador.
      </p>

      <div className="my-3 flex flex-wrap gap-2">
        <button type="button" className={boton} onClick={descargar}>
          Descargar respaldo
        </button>
        <button
          type="button"
          className={boton}
          onClick={() => inputRef.current?.click()}
        >
          Restaurar respaldo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={restaurar}
          aria-label="Elegir archivo de respaldo"
        />
      </div>

      {mensaje && (
        <p
          className={
            esError
              ? "m-0 rounded-[10px] border border-error-borde bg-error-fondo p-[10px_12px] text-[0.9rem] text-error-texto"
              : "m-0 rounded-[10px] border border-exito-borde bg-exito-fondo p-[10px_12px] text-[0.9rem] text-exito-texto"
          }
        >
          {mensaje}
        </p>
      )}
    </section>
  );
}
