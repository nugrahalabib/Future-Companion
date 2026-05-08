/**
 * Public endpoint — returns metadata about the currently-active welcome
 * audio clip. The /welcome page calls this on mount so it can preload
 * the audio URL and show the operator-set name on screen. Audio bytes
 * are streamed separately from /api/welcome-audio/[id]/audio.
 */

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const row = await prisma.welcomeAudio.findFirst({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      durationSeconds: true,
      voiceName: true,
      mode: true,
    },
  });
  if (!row) {
    return Response.json({ ok: false, error: "no_active_welcome_audio" }, { status: 404 });
  }
  return Response.json({
    ok: true,
    item: {
      ...row,
      audioUrl: `/api/welcome-audio/${row.id}/audio`,
    },
  });
}
