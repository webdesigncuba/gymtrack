import { cargarSesiones, guardarSesiones, olvidarSesiones } from "@/lib/datos";
import { olvidarComidas } from "@/lib/alimentos";
import { olvidarAlimentosCustom } from "@/lib/alimentosCustom";
import { olvidarPerfil } from "@/lib/perfil";
import { olvidarPlantillas } from "@/lib/plantillas";
import type { Sesion } from "@/lib/tipos";

// Interfaz de almacenamiento: toda la persistencia de la app pasa por aquí.
// Hoy la implementa `localStorage` (`almacenLocal`); el día que haga falta
// una base de datos (p. ej. sincronizar varios dispositivos), basta con
// escribir otra implementación sin tocar el resto del código.

/** Operaciones mínimas que necesita la app para persistir sesiones. */
export interface Almacen {
  cargar: () => Promise<Sesion[]>;
  guardar: (sesiones: Sesion[]) => Promise<void>;
}

/** Implementación actual: guarda en el `localStorage` del navegador. */
export const almacenLocal: Almacen = {
  cargar: async () => cargarSesiones(),
  guardar: async (sesiones) => {
    guardarSesiones(sesiones);
  },
};

/**
 * Borra la caché local (sesiones, plantillas, comidas, alimentos y perfil). Se llama al
 * cerrar sesión para no dejar los datos del usuario en el navegador.
 */
export function limpiarCacheLocal(): void {
  olvidarSesiones();
  olvidarPlantillas();
  olvidarComidas();
  olvidarAlimentosCustom();
  olvidarPerfil();
}
