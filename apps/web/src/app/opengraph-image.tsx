import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "llm · build a language model by hand";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0b0a",
          color: "#f5f2eb",
          padding: "64px 72px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: "0.14em", textTransform: "uppercase", color: "#a8a29e" }}>
          Blue Grey Boxes
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.02em" }}>
            llm · build by hand
          </div>
          <div style={{ fontSize: 30, color: "#d6d3d1", lineHeight: 1.35, maxWidth: 960 }}>
            Build the smallest working language model, one piece at a time. Plain words first.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#78716c" }}>
          <span>llm.bluegreyboxes.com</span>
          <span>Interactive Course</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
