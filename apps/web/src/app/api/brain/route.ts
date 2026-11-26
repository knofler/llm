import { NextResponse } from "next/server";
import { serverHasBrain } from "@/lib/brain/complete";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ brain: serverHasBrain() });
}
