import { NextRequest, NextResponse } from "next/server";
import { auth0Enabled, handlers } from "@/auth";

export async function GET(req: NextRequest) {
  if (!auth0Enabled()) {
    return NextResponse.json({ error: "Auth0 sign-in is not configured" }, { status: 404 });
  }
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  if (!auth0Enabled()) {
    return NextResponse.json({ error: "Auth0 sign-in is not configured" }, { status: 404 });
  }
  return handlers.POST(req);
}
