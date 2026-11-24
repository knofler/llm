import { iconResponse, type IconKind } from "@/lib/pwa-icon";

// Static PNGs for the manifest, rendered once at build time.
const FILES: Record<string, [number, IconKind]> = {
  "icon-48.png": [48, "favicon"],
  "icon-192.png": [192, "any"],
  "icon-512.png": [512, "any"],
  "icon-maskable-512.png": [512, "maskable"],
};

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(FILES).map((file) => ({ file }));
}

export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const spec = FILES[file];
  if (!spec) return new Response("Not found", { status: 404 });
  return iconResponse(spec[0], spec[1]);
}
