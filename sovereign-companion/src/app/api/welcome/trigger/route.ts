/**
 * Public welcome trigger. POSTed by the welcome button on
 * welcompanion.agentbuff.id (port 2975, route /welcome).
 *
 * On hit:
 *   1. Look up the active welcome audio clip in the DB.
 *   2. Fire Tuya — set every connected light to blue, then specifically
 *      override soft box 2 to pink. We use the admin-side dispatcher
 *      (aiOnly=false) so the trigger touches every synced device, not
 *      just the AI allowlist — the welcome scene is operator-curated
 *      and may want to bring in lights the AI shouldn't touch.
 *   3. Broadcast a `welcome` SSE event so every page on port 2970
 *      (except /survey/* and /admin/*) can navigate back to /.
 *   4. Return the active audio URL so the welcome page can play it.
 *
 * No auth — this is meant to be reachable from a public booth touch
 * panel. Add reverse-proxy IP allowlisting if needed for prod.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcast, subscriberCount } from "@/lib/welcomeBus";
import { executeControl } from "@/lib/tuya/manager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface LightingStep {
  label: string;
  ok: boolean;
  message?: string;
}

interface LightingResult {
  ok: boolean;
  steps: LightingStep[];
}

// Welcome scene orchestration. Order matters and is deliberate per
// Tuya's quirks:
//
//   1. Power-ON FIRST. If we issue "set color" against a powered-off
//      bulb the cloud accepts it but we don't see the change until the
//      next power-on, which then sometimes flashes white before the
//      colour applies. Sending switch=true as its own up-front call
//      avoids that race entirely.
//
//   2. Then COLOR ONLY (no brightness, no temperature). Sending
//      brightness or temp in the same payload as a colour command
//      kicks the work_mode back to white on several Tuya devices
//      (observed on lampu meja + soft box 1). The `v` channel inside
//      colour_data already controls brightness within colour mode,
//      so a separate bright_value command is redundant AND breaks the
//      colour mode. Same applies to temp_value.
//
//   3. lampu tidur is intentionally on the power-on list. It's a smart
//      socket (no colour, no brightness, just on/off) so it falls
//      outside the "all lights" filter, but operators expect the room
//      lit up at welcome, including the bedside lamp.
async function fireWelcomeLighting(): Promise<LightingResult> {
  const steps: LightingStep[] = [];

  const run = async (label: string, args: Parameters<typeof executeControl>[0]) => {
    const r = await executeControl(args, false);
    const message = r.message ?? r.error;
    steps.push({ label, ok: r.success, message });
    return r.success;
  };

  // ----- Step 1: power on EVERYTHING the booth might need on. -----
  // "all lights" catches every colour-/dimmer-capable bulb (lampu meja,
  // strips, soft boxes). lampu tidur is a switch-only smart socket so
  // we hit it explicitly.
  await run("all lights → on", { target: "all lights", action: "on" });
  await run("lampu tidur → on", { target: "lampu tidur", action: "on" });

  // ----- Step 2: paint the room blue (colour command only). -----
  await run("all lights → blue", { target: "all lights", action: "set", color: "blue" });

  // ----- Step 3: override soft box 2 → pink. -----
  await run("soft box 2 → pink", { target: "soft box 2", action: "set", color: "pink" });

  const ok = steps.every((s) => s.ok);
  return { ok, steps };
}

export async function POST(_req: NextRequest) {
  // 1) Look up active welcome audio
  const audio = await prisma.welcomeAudio.findFirst({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      durationSeconds: true,
    },
  });

  // 2) Fire Tuya in parallel with everything else (don't block the
  //    response on Tuya — the broadcast + audio URL are what the
  //    welcome page actually needs to start playing).
  const lightingPromise: Promise<LightingResult> = fireWelcomeLighting().catch((err) => ({
    ok: false,
    steps: [
      {
        label: "fireWelcomeLighting threw",
        ok: false,
        message: err instanceof Error ? err.message : String(err),
      },
    ],
  }));

  // 3) Broadcast SSE — happens synchronously off the in-memory bus
  const recipients = broadcast({
    type: "welcome",
    timestamp: Date.now(),
    audioId: audio?.id ?? null,
  });

  // Wait for lighting so the response carries an honest report; the
  // audio URL is independent so we already know we can return it.
  const lighting = await lightingPromise;

  console.log(
    `[welcome] trigger fired — audio=${audio?.id ?? "none"} broadcast=${recipients} subs lighting=${lighting.ok ? "ok" : "partial"}`,
  );

  if (!audio) {
    return Response.json(
      {
        ok: false,
        error: "no_active_welcome_audio",
        broadcastRecipients: recipients,
        lighting,
      },
      { status: 404 },
    );
  }

  return Response.json({
    ok: true,
    audio: {
      id: audio.id,
      name: audio.name,
      durationSeconds: audio.durationSeconds,
      audioUrl: `/api/welcome-audio/${audio.id}/audio`,
    },
    broadcastRecipients: recipients,
    subscribers: subscriberCount(),
    lighting,
  });
}
