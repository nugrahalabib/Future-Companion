import { NextRequest, NextResponse } from "next/server";
import {
  evaluateStatus,
  getAppSettings,
  updateAppSettings,
  verifyAdminPassword,
} from "@/lib/demoMode";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  if (!verifyAdminPassword(req.headers.get("x-admin-password"))) {
    return unauthorized();
  }
  const snapshot = await getAppSettings();
  const status = evaluateStatus(snapshot);
  return NextResponse.json({ snapshot, status });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminPassword(req.headers.get("x-admin-password"))) {
    return unauthorized();
  }
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const patch = {
    demoEnabled: typeof body.demoEnabled === "boolean" ? body.demoEnabled : undefined,
    pausedMessage: typeof body.pausedMessage === "string" ? body.pausedMessage : undefined,
    scheduleEnabled: typeof body.scheduleEnabled === "boolean" ? body.scheduleEnabled : undefined,
    activeFromHour: typeof body.activeFromHour === "number" ? body.activeFromHour : undefined,
    activeToHour: typeof body.activeToHour === "number" ? body.activeToHour : undefined,
    updatedBy: typeof body.updatedBy === "string" ? body.updatedBy : "admin",
  };

  const snapshot = await updateAppSettings(patch);
  const status = evaluateStatus(snapshot);
  return NextResponse.json({ snapshot, status });
}
