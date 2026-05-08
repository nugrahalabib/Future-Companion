/**
 * Public endpoint that streams the raw WAV bytes for a given clip id.
 * Used both by the /welcome page (loads the active clip) and by the
 * admin Welcome panel (per-clip preview <audio src>). No auth — clip
 * ids are cuid()s, so guessing one out of the air is impractical.
 */

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const row = await prisma.welcomeAudio.findUnique({
    where: { id },
    select: { audioData: true, name: true },
  });
  if (!row) {
    return new Response("not found", { status: 404 });
  }
  // Prisma's Bytes column comes back as Uint8Array. We copy into a fresh
  // ArrayBuffer so Response's BodyInit narrowing accepts it (the source
  // buffer is typed as ArrayBufferLike which can be SharedArrayBuffer).
  const src = row.audioData as Uint8Array;
  const buf = new ArrayBuffer(src.byteLength);
  new Uint8Array(buf).set(src);
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": "audio/wav",
      "Content-Length": String(src.byteLength),
      // Browsers need range support for <audio controls> seek bar; the
      // Buffer-based response is small enough that we just send the
      // whole file each time. Cache for an hour — the operator only
      // changes welcome audio infrequently.
      "Cache-Control": "private, max-age=3600",
      // Friendly download filename if the operator clicks save.
      "Content-Disposition": `inline; filename="${encodeURIComponent(row.name)}.wav"`,
    },
  });
}
