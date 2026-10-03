import type { MetadataRoute } from "next";

// Manifiesto PWA: hace la app instalable y la abre a pantalla completa
// (standalone) directamente en el diario. Sin dependencias externas.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GymTrack — Diario de ejercicios",
    short_name: "GymTrack",
    description: "Registra tus sesiones de gimnasio y no pierdas tu racha.",
    start_url: "/diario",
    display: "standalone",
    background_color: "#131518",
    theme_color: "#131518",
    lang: "es",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
