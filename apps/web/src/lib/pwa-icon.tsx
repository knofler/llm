import { ImageResponse } from "next/og";

// llm icon: three boxes joined by a wire, the model drawn as a box diagram.
// ImageResponse needs inline styles; this file is the only place they are allowed.
export const ICON_BG = "#0b0b0a";
const BOX = "#ff7a1f";
const WIRE = "#b3541a";

export type IconKind = "any" | "maskable" | "touch" | "favicon";

// Content scale per kind: maskable keeps everything inside the 80% safe circle.
const SCALE: Record<IconKind, number> = { any: 1.12, maskable: 0.84, touch: 1.0, favicon: 1.4 };

export function iconResponse(px: number, kind: IconKind) {
  const k = SCALE[kind];
  const u = px / 100;
  const at = (v: number) => (50 + (v - 50) * k) * u;
  const len = (v: number) => v * k * u;
  const rect = (x: number, y: number, w: number, h: number, color: string, r: number) => (
    <div
      style={{
        position: "absolute",
        left: at(x),
        top: at(y),
        width: len(w),
        height: len(h),
        background: color,
        borderRadius: len(r),
      }}
    />
  );
  const rounded = kind === "any" || kind === "favicon" ? px * 0.22 : 0;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: ICON_BG,
          borderRadius: rounded,
        }}
      >
        {rect(48, 42, 4, 8, WIRE, 1)}
        {rect(32, 48, 36, 4, WIRE, 1)}
        {rect(30, 50, 4, 8, WIRE, 1)}
        {rect(66, 50, 4, 8, WIRE, 1)}
        {rect(34, 20, 32, 24, BOX, 6)}
        {rect(19, 58, 28, 22, BOX, 6)}
        {rect(53, 58, 28, 22, BOX, 6)}
      </div>
    ),
    { width: px, height: px },
  );
}
