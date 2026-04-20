import { NextResponse } from "next/server";
import { verifyAdminPassword } from "./demoMode";

export function requireAdmin(req: Request): NextResponse | null {
  if (!verifyAdminPassword(req.headers.get("x-admin-password"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
