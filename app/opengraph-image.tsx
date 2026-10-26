import { ImageResponse } from "next/og";

export const alt = "Alquiler en Regla: tu alquiler en piloto automático y siempre en regla";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#f7f6f2",
          color: "#1d2420",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 800, color: "#1f6f50" }}>Alquiler en Regla</div>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>
          Tu alquiler en piloto automático. Y siempre en regla.
        </div>
        <div style={{ fontSize: 32, color: "#5d6762", marginTop: 32 }}>
          Alertas, cobros y la carta de subida con el índice correcto.
        </div>
      </div>
    ),
    size,
  );
}
