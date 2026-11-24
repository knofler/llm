// Injected at build time by next.config.ts (package.json version + Vercel commit SHA).
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";
export const GIT_SHA = process.env.NEXT_PUBLIC_GIT_SHA ?? "dev";
export const VERSION_LABEL = `v${APP_VERSION} · ${GIT_SHA}`;
