/**
 * Per-clip admin operations.
 *
 *   DELETE  — remove the clip (also removes its audio bytes).
 *   POST    — body {action:"activate"} flips this clip to isActive=true
 *             and clears the flag on every other row in one transaction
 *             so the booth always has exactly one active welcome chime.
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const { id } = await ctx.params;
  try {
    await prisma.welcomeAudio.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 404 },
    );
  }
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const { id } = await ctx.params;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const action = String(body.action ?? "");
  if (action !== "activate") {
    return Response.json({ ok: false, error: `unknown action: ${action}` }, { status: 400 });
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const target = await tx.welcomeAudio.findUnique({ where: { id } });
      if (!target) throw new Error("welcome_audio_not_found");
      // Demote every other row first, then promote the target. Two
      // updateMany calls so the index gets used.
      await tx.welcomeAudio.updateMany({
        where: { id: { not: id }, isActive: true },
        data: { isActive: false },
      });
      const promoted = await tx.welcomeAudio.update({
        where: { id },
        data: { isActive: true },
      });
      return promoted;
    });
    return Response.json({ ok: true, item: { id: result.id, isActive: result.isActive } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "welcome_audio_not_found") {
      return Response.json({ ok: false, error: message }, { status: 404 });
    }
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
