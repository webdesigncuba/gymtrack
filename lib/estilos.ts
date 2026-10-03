// Clases Tailwind compartidas para no repetirlas en cada componente.
// Son la traducción 1:1 de los estilos que había en `globals.css`.

/** Tarjeta de acero. */
export const TARJETA =
  "rounded-2xl border border-borde bg-tarjeta p-5 shadow-[0_8px_28px_rgba(0,0,0,0.35)]";

/** Título de sección. */
export const TITULO = "mb-4 flex items-center gap-2 text-[1.15rem] font-semibold";

/** Subtítulo apagado. */
export const SUBTITULO = "mb-2.5 mt-5 text-base text-suave";

/** Base de todos los botones (incluye foco visible ámbar y estado deshabilitado). */
const BOTON_BASE =
  "min-h-11 cursor-pointer rounded-[10px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento disabled:cursor-not-allowed disabled:opacity-50";

/** Botón principal ámbar de alta visibilidad. */
export const BOTON_PRINCIPAL = `${BOTON_BASE} border-none bg-acento px-[18px] py-[13px] text-[0.95rem] text-acento-texto hover:bg-[#ffb63d]`;

/** Botón secundario en acero. */
export const BOTON_SECUNDARIO = `${BOTON_BASE} border border-borde bg-transparent px-3.5 py-2.5 text-[0.95rem] text-texto hover:bg-interior`;

/** Botón pequeño neutro (Editar). */
export const BOTON_MINI = `${BOTON_BASE} min-h-0 border border-borde bg-transparent px-2.5 py-[5px] text-[0.8rem] text-texto hover:bg-interior`;

/** Botón secundario pequeño alineado al inicio (+ Añadir tanda). */
export const BOTON_SECUNDARIO_SM = `${BOTON_BASE} self-start border border-borde bg-transparent px-3 py-2 text-[0.85rem] text-texto hover:bg-interior`;

/** Botón pequeño de peligro alineado al inicio (Quitar ejercicio). */
export const BOTON_PELIGRO_SM = `${BOTON_BASE} self-start border border-[rgba(242,85,90,0.4)] bg-transparent px-3 py-2 text-[0.85rem] text-peligro hover:bg-[rgba(242,85,90,0.12)]`;

/** Botón ✕ para quitar tandas. */
export const BOTON_PELIGRO_TANDA = `${BOTON_BASE} border border-[rgba(242,85,90,0.4)] bg-transparent px-[11px] py-[9px] text-peligro hover:bg-[rgba(242,85,90,0.12)]`;

/** Botón pequeño de peligro (Eliminar, Quitar). */
export const BOTON_PELIGRO_MINI = `${BOTON_BASE} min-h-0 border border-[rgba(242,85,90,0.4)] bg-transparent px-2.5 py-[5px] text-[0.8rem] text-peligro hover:bg-[rgba(242,85,90,0.12)]`;

/** Etiqueta pequeña de campo. */
export const ETIQUETA = "text-[0.85rem] font-semibold text-suave";

/** Campo de texto/número/fecha/desplegable. */
export const CAMPO_ENTRADA =
  "min-h-11 w-full rounded-[10px] border border-borde bg-hondo px-3 py-2.5 text-base text-texto focus-visible:border-transparent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-acento";

/** Texto de ayuda apagado. */
export const PISTA = "m-0 text-[0.8rem] text-suave";

/** Mensaje de error. */
export const ERROR =
  "m-0 rounded-[10px] border border-error-borde bg-error-fondo p-[10px_12px] text-[0.9rem] text-error-texto";
