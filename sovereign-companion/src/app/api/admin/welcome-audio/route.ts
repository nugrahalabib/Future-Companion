/**
 * Admin endpoints for the welcome-audio library.
 *
 *   GET   — list all saved clips (without the audio bytes — those would
 *           bloat the response; client fetches them via
 *           /api/welcome-audio/[id]/audio when previewing).
 *   POST  — save a new clip from a base64-encoded WAV data URL (what
 *           the TTS Studio panel hands us when the operator clicks
 *           "Save to Library").
 *
 * Per-clip operations (delete, activate) live under [id]/route.ts.
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_NAME = 120;
const MAX_TRANSCRIPT = 8000;
const MAX_AUDIO_BYTES = 6 * 1024 * 1024; // 6 MB ≈ ~ 2 minutes of 24kHz mono 16-bit

function decodeAudioPayload(input: unknown): Buffer | null {
  if (typeof input !== "string") return null;
  // Accept either a raw base64 string or a `data:audio/wav;base64,...` URL.
  const m = input.match(/^data:[^;]+;base64,(.+)$/);
  const b64 = m ? m[1] : input;
  try {
    const buf = Buffer.from(b64, "base64");
    if (buf.length === 0 || buf.length > MAX_AUDIO_BYTES) return null;
    // Sanity check: standard RIFF/WAVE starts with "RIFF" + 4 bytes + "WAVE"
    if (buf.slice(0, 4).toString("ascii") !== "RIFF") return null;
    if (buf.slice(8, 12).toString("ascii") !== "WAVE") return null;
    return buf;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  try {
    const rows = await prisma.welcomeAudio.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        transcript: true,
        mode: true,
        model: true,
        voiceName: true,
        speakers: true,
        languageCode: true,
        durationSeconds: true,
        isActive: true,
        createdAt: true,
      },
    });
    return Response.json({ ok: true, items: rows });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > MAX_NAME) {
    return Response.json({ ok: false, error: "name required (≤120 chars)" }, { status: 400 });
  }
  const transcript = typeof body.transcript === "string" ? body.transcript : "";
  if (transcript.length > MAX_TRANSCRIPT) {
    return Response.json({ ok: false, error: "transcript too long" }, { status: 400 });
  }
  const audioData = decodeAudioPayload(body.audioData ?? body.audioDataUrl);
  if (!audioData) {
    return Response.json(
      { ok: false, error: "invalid audio payload (expecting base64 WAV with RIFF/WAVE header)" },
      { status: 400 },
    );
  }
  const durationSeconds =
    typeof body.durationSeconds === "number" ? body.durationSeconds : 0;
  const mode = body.mode === "multi" ? "multi" : "single";
  const model = typeof body.model === "string" ? body.model : "gemini-2.5-flash-preview-tts";
  const voiceName = typeof body.voiceName === "string" ? body.voiceName : null;
  const speakers = body.speakers ? JSON.stringify(body.speakers) : null;
  const languageCode = typeof body.languageCode === "string" ? body.languageCode : null;

  try {
    const created = await prisma.welcomeAudio.create({
      data: {
        name,
        transcript,
        mode,
        model,
        voiceName,
        speakers,
        languageCode,
        // Prisma's Bytes column wants Uint8Array<ArrayBuffer>. Buffer's
        // underlying buffer is typed as ArrayBufferLike (which includes
        // SharedArrayBuffer), so TS rejects a direct assignment. Copy
        // the bytes into a fresh ArrayBuffer-backed Uint8Array first.
        audioData: (() => {
          const ab = new ArrayBuffer(audioData.byteLength);
          new Uint8Array(ab).set(audioData);
          return new Uint8Array(ab);
        })(),
        durationSeconds,
      },
      select: {
        id: true,
        name: true,
        transcript: true,
        mode: true,
        model: true,
        voiceName: true,
        speakers: true,
        languageCode: true,
        durationSeconds: true,
        isActive: true,
        createdAt: true,
      },
    });
    return Response.json({ ok: true, item: created });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
