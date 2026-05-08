/**
 * Public endpoint fired by the checkout page when the visitor confirms
 * "barang diterima" / "item received". Triggers the Tuya delivery
 * scene:
 *
 *   1. Power on every controllable light (idempotent — picks up bulbs
 *      that may have been off, including the welcome blue scene).
 *   2. Set every colour-capable light to bright white (work_mode=white
 *      + bright_value=max). The HSV colour command is skipped because
 *      "white" routes through the white-mode branch in executeControl.
 *   3. Turn lampu tidur OFF — the bedside lamp drops out of the scene
 *      because the booth narrative is "package has arrived in your
 *      brightly-lit suite", not "evening cosy".
 *
 * Same pattern as /api/welcome/trigger: explicit ON-first to avoid the
 * power-on race that flashes white before the colour change lands,
 * then attribute commands. Returns per-step status so the operator can
 * tell at a glance what worked.
 */

import { NextRequest } from "next/server";
import { executeControl } from "@/lib/tuya/manager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface LightingStep {
  label: string;
  ok: boolean;
  message?: string;
}

export async function POST(_req: NextRequest) {
  const steps: LightingStep[] = [];

  const run = async (label: string, args: Parameters<typeof executeControl>[0]) => {
    const r = await executeControl(args, false); // not aiOnly, operator-curated scene
    steps.push({ label, ok: r.success, message: r.message ?? r.error });
  };

  // 1) Power-on first. Idempotent; gets bulbs that the welcome scene
  //    or a previous visitor turned off.
  await run("all lights → on", { target: "all lights", action: "on" });

  // 2) Bright white across every colour-capable light. White mode
  //    accepts brightness in the same call (only colour mode kicks
  //    back to white when brightness arrives separately).
  await run("all lights → bright white", {
    target: "all lights",
    action: "set",
    color: "white",
    brightness: 100,
  });

  // 3) lampu tidur off — switch_1 socket, no colour/brightness to set.
  await run("lampu tidur → off", { target: "lampu tidur", action: "off" });

  const ok = steps.every((s) => s.ok);
  console.log(
    `[checkout-celebrate] fired, ${steps.map((s) => `${s.ok ? "✓" : "✗"} ${s.label}`).join(" · ")}`,
  );
  return Response.json({ ok, steps });
}
