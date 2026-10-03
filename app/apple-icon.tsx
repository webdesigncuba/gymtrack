import { ImageResponse } from "next/og";

// Icono para Apple (180 px, esquinas ya recortadas por iOS: sin borderRadius).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 22, height: 100, background: "#f5a524", borderRadius: 8 }} />
          <div style={{ width: 15, height: 70, background: "#f5a524", borderRadius: 6, marginLeft: 6 }} />
          <div style={{ width: 70, height: 10, background: "#edeff2", borderRadius: 5 }} />
          <div style={{ width: 15, height: 70, background: "#f5a524", borderRadius: 6, marginRight: 6 }} />
          <div style={{ width: 22, height: 100, background: "#f5a524", borderRadius: 8 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
