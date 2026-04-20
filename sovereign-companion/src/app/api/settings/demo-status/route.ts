import { NextResponse } from "next/server";
import { getDemoStatus } from "@/lib/demoMode";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const status = await getDemoStatus();
  return NextResponse.json(status, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
