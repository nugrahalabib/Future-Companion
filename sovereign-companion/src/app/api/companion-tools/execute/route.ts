import { NextRequest } from "next/server";
import {
  executeControl,
  executeQuery,
  listDeviceNamesForAi,
  loadAllowedDevices,
} from "@/lib/tuya/manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Runtime tool dispatcher for the AI companion. Browser fetches POST here
// when Gemini calls one of the smart-home tools; we route to the appropriate
// Tuya manager helper and return a JSON payload the model verbalizes.

export async function POST(req: NextRequest) {
  let body: { name?: string; args?: Record<string, unknown> } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const name = String(body.name ?? "");
  const args = (body.args ?? {}) as Record<string, unknown>;

  try {
    // The companion-tools dispatcher is the AI runtime path. Every call
    // here passes aiOnly=true so the model can only see and address the
    // devices admin has whitelisted in /admin/tuya.
    if (name === "list_smart_devices") {
      const devices = await loadAllowedDevices();
      const summary = await listDeviceNamesForAi();
      return Response.json({
        ok: true,
        count: devices.length,
        devices: summary,
        message:
          devices.length === 0
            ? "No devices are whitelisted for AI control yet. Ask the booth admin to allow some in /admin/tuya."
            : `Owner has ${devices.length} device(s) connected: ${summary.join("; ")}`,
      });
    }

    if (name === "control_smart_home") {
      const target = typeof args.target === "string" ? args.target : "";
      const action = typeof args.action === "string" ? args.action : "on";
      const brightness =
        typeof args.brightness === "number"
          ? args.brightness
          : typeof args.brightness === "string"
            ? Number(args.brightness)
            : undefined;
      const color = typeof args.color === "string" ? args.color : undefined;
      const temperature =
        typeof args.temperature === "number"
          ? args.temperature
          : typeof args.temperature === "string"
            ? Number(args.temperature)
            : undefined;
      if (!target) {
        return Response.json({ ok: false, error: "target is required" });
      }
      const result = await executeControl(
        {
          target,
          action,
          brightness: Number.isFinite(brightness) ? brightness : undefined,
          color,
          temperature: Number.isFinite(temperature) ? temperature : undefined,
        },
        true, // aiOnly — restrict to whitelisted devices
      );
      return Response.json({
        ok: result.success,
        device: result.device,
        action: result.action,
        message: result.message,
        error: result.error,
      });
    }

    if (name === "query_smart_home") {
      const target = typeof args.target === "string" ? args.target : undefined;
      const result = await executeQuery({ target }, true);
      return Response.json({
        ok: result.success,
        devices: result.devices,
        message: result.message,
      });
    }

    return Response.json({ ok: false, error: `Unknown tool: ${name}` }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[companion-tools/execute] failed:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
