import { ImageResponse } from "next/og";

// Icono PWA (512 px) generado en el build: disco y barra ámbar sobre caucho.
// Sin archivos binarios que mantener ni peticiones externas.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#131518",
          borderRadius: 112,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 64, height: 280, background: "#f5a524", borderRadius: 24 }} />
          <div style={{ width: 44, height: 200, background: "#f5a524", borderRadius: 18, marginLeft: 16 }} />
          <div style={{ width: 200, height: 28, background: "#edeff2", borderRadius: 14 }} />
          <div style={{ width: 44, height: 200, background: "#f5a524", borderRadius: 18, marginRight: 16 }} />
          <div style={{ width: 64, height: 280, background: "#f5a524", borderRadius: 24 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
