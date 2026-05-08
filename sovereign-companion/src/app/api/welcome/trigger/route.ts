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

interface LightingResult {
  ok: boolean;
  message?: string;
  attempted: string[];
}

async function fireWelcomeLighting(): Promise<LightingResult> {
  const attempted: string[] = [];
  let allOk = true;
  const messages: string[] = [];

  // 1) All lights → on + blue
  attempted.push("all lights → blue");
  const allRes = await executeControl(
    {
      target: "all lights",
      action: "set",
      color: "blue",
      brightness: 80,
    },
    false, // not aiOnly — operator scene can touch every synced light
  );
  if (!allRes.success) {
    allOk = false;
    if (allRes.error) messages.push(`all lights: ${allRes.error}`);
    if (allRes.message) messages.push(`all lights: ${allRes.message}`);
  }

  // 2) Override: soft box 2 → pink (so the booth ends with a blue room
  //    + a pink accent on soft box 2). Soft box 1 stays blue from step 1.
  attempted.push("soft box 2 → pink");
  const sb2 = await executeControl(
    {
      target: "soft box 2",
      action: "set",
      color: "pink",
      brightness: 80,
    },
    false,
  );
  if (!sb2.success) {
    // Not fatal — the welcome event still fires even if a single light
    // glitches. We surface it in the response so the operator can fix.
    if (sb2.error) messages.push(`soft box 2: ${sb2.error}`);
    if (sb2.message) messages.push(`soft box 2: ${sb2.message}`);
  }

  return { ok: allOk, message: messages.join("; ") || undefined, attempted };
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
  const lightingPromise = fireWelcomeLighting().catch((err) => ({
    ok: false,
    message: err instanceof Error ? err.message : String(err),
    attempted: [],
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
