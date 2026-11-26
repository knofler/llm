"use server";

import { auth0Enabled, signIn, signOut } from "@/auth";

export async function signInWithAuth0() {
  if (!auth0Enabled()) return;
  await signIn("auth0", { redirectTo: "/" });
}

export async function signOutAccount() {
  if (!auth0Enabled()) return;
  await signOut({ redirectTo: "/" });
}
