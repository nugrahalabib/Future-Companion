import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/demoMode";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  let body: { password?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const password = typeof body.password === "string" ? body.password : "";
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ ok: false, error: "invalid_password" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
