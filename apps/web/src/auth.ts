import NextAuth from "next-auth";
import Auth0 from "next-auth/providers/auth0";

/**
 * Optional Auth.js v5 + Auth0 sign-in (Pattern B).
 * The site stays fully public. When any of the four AUTH_* server env vars is
 * unset, sign-in stays disabled, /api/auth/* returns 404, and the button is hidden.
 */
export function auth0Enabled(): boolean {
  return Boolean(
    process.env.AUTH_SECRET?.trim() &&
      process.env.AUTH_AUTH0_ID?.trim() &&
      process.env.AUTH_AUTH0_SECRET?.trim() &&
      process.env.AUTH_AUTH0_ISSUER?.trim(),
  );
}

const nextAuth = NextAuth(() => {
  const enabled = auth0Enabled();
  return {
    secret: process.env.AUTH_SECRET || "unconfigured-disabled-placeholder",
    trustHost: true,
    providers: enabled
      ? [
          Auth0({
            clientId: process.env.AUTH_AUTH0_ID,
            clientSecret: process.env.AUTH_AUTH0_SECRET,
            issuer: process.env.AUTH_AUTH0_ISSUER,
          }),
        ]
      : [],
  };
});

export const { handlers, auth, signIn, signOut } = nextAuth;

export async function getOptionalSession() {
  if (!auth0Enabled()) return null;
  try {
    return await auth();
  } catch {
    return null;
  }
}
