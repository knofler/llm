import type { MetadataRoute } from "next";
import { THEME_COLOR } from "@/lib/theme-color";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "llm: build a language model by hand",
    short_name: "llm",
    description:
      "Build the smallest working language model, one piece at a time. Plain words first, real names once you've earned them.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: THEME_COLOR.adults,
    theme_color: THEME_COLOR.adults,
    categories: ["education"],
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
