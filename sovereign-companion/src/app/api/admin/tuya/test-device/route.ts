import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { executeControl } from "@/lib/tuya/manager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Manual device-test endpoint — admin uses this to dry-run a command without
// going through the AI loop. Same control surface as the runtime AI tool, so
// what works here will also work when Gemini calls it.
export async function POST(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const target = typeof body.target === "string" ? body.target : "";
  const action = typeof body.action === "string" ? body.action : "on";
  const brightness = typeof body.brightness === "number" ? body.brightness : undefined;
  const color = typeof body.color === "string" ? body.color : undefined;
  const temperature = typeof body.temperature === "number" ? body.temperature : undefined;
  if (!target) {
    return Response.json({ ok: false, error: "target required" }, { status: 400 });
  }
  try {
    const result = await executeControl({ target, action, brightness, color, temperature });
    return Response.json({
      ok: result.success,
      message: result.message,
      device: result.device,
      action: result.action,
      error: result.error,
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
