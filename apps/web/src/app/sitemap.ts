import type { MetadataRoute } from "next";

const SITE_URL = "https://llm.bluegreyboxes.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-27");
  return [{ url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1.0 }];
}
