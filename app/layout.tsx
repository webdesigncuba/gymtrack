import "./globals.css";
import { Oswald } from "next/font/google";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Diario de seguimiento de ejercicios",
  description: "Registra tus sesiones de gimnasio y consulta tu racha de días seguidos.",
};

// Barra del navegador a juego con el tema (también en iOS al instalarla).
export const viewport: Viewport = {
  themeColor: "#131518",
  width: "device-width",
  initialScale: 1,
};

// Display condensada para los numerales de marcador (racha y cronómetro).
// next/font la autohospeda en el build: sin dependencias ni peticiones externas.
const display = Oswald({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={display.variable}>{children}</body>
    </html>
  );
}
