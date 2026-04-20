import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getDemoStatus } from "@/lib/demoMode";
import { prisma } from "@/lib/prisma";

// Per-IP token-bucket rate limit. Ephemeral tokens are single-use and short-
// lived, but the mint call still counts toward Gemini quota and each minted
// token lets the holder open a 20-minute audio stream. Without a limit, a
// scraper who finds the endpoint could burn the account.
//
// Single-process PM2 fork mode means an in-memory Map is sufficient. If this
// ever scales horizontally, swap to Redis.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 15; // per IP per window
const rateBuckets = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const bucket = (rateBuckets.get(ip) ?? []).filter((t) => t > cutoff);
  if (bucket.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(ip, bucket);
    return true;
  }
  bucket.push(now);
  rateBuckets.set(ip, bucket);
  return false;
}

// Mints a short-lived ephemeral token with the FULL live-session config locked
// inside `liveConnectConstraints.config`. Per official docs:
//   https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
// the server-locked constraint is the source of truth for the session —
// anything the client sends that isn't in the constraint is dropped. So if we
// only lock `responseModalities`, the client's systemInstruction, voice, and
// transcription configs are silently stripped. That's why audio worked but the
// persona context and transcripts never came through.
//
// Fix: accept persona+voice+language from the client, build the full config
// here, and lock it in the constraint. The master GEMINI_API_KEY stays on the
// server; the browser only ever sees the short-lived token.
//
// Lifecycle:
//   - `expireTime` caps total session length (20 min safety; we use 5)
//   - `newSessionExpireTime` bounds how long the token can OPEN a new session

export async function POST(req: NextRequest) {
  const status = await getDemoStatus();
  if (!status.active) {
    return Response.json(
      { error: "demo_paused", reason: status.reason, message: status.message },
      { status: 503 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY missing on server" },
      { status: 500 },
    );
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return Response.json(
      { error: "rate_limited", message: "Too many token requests. Try again in a few minutes." },
      { status: 429 },
    );
  }

  let model = "gemini-2.5-flash-native-audio-preview-12-2025";
  let systemPrompt: string | undefined;
  let voiceName = "Kore";
  let languageCode: string | undefined;
  let userId: string | undefined;

  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.userId === "string") userId = body.userId;
    if (typeof body?.model === "string") model = body.model;
    if (typeof body?.systemPrompt === "string") systemPrompt = body.systemPrompt;
    if (typeof body?.voiceName === "string" && body.voiceName) voiceName = body.voiceName;
    if (typeof body?.languageCode === "string" && body.languageCode) languageCode = body.languageCode;
  } catch {}

  if (!userId) {
    return Response.json(
      { error: "missing_user", message: "userId required. Register and complete the creator flow first." },
      { status: 401 },
    );
  }

  // Session-gate: caller must be a real registered user who has already
  // saved a companion config (i.e. finished the creator flow). This keeps
  // the endpoint from becoming a public Gemini proxy for scrapers.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { companionConfig: true },
  });
  if (!user) {
    return Response.json({ error: "invalid_user" }, { status: 401 });
  }
  if (!user.companionConfig) {
    return Response.json(
      { error: "companion_not_ready", message: "Complete the creator flow first." },
      { status: 403 },
    );
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1alpha" },
    });

    const now = Date.now();
    const SESSION_WINDOW_MS = 20 * 60 * 1000;
    const NEW_SESSION_WINDOW_MS = 60 * 1000;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const speechConfig: any = {
      voiceConfig: { prebuiltVoiceConfig: { voiceName } },
    };
    if (languageCode) speechConfig.languageCode = languageCode;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lockedConfig: any = {
      responseModalities: ["AUDIO"],
      speechConfig,
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    };
    if (systemPrompt) {
      lockedConfig.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    // Latency knob. Live API models "think" before responding, and for a
    // small-talk companion demo that extra latency is audible.
    //  - 3.1 flash-live uses `thinkingLevel` ("minimal" | "low" | "medium" | "high"),
    //    default is already "minimal" — we pin it explicitly to be safe.
    //  - 2.5 native-audio uses `thinkingBudget` (token count). Setting it to 0
    //    disables thinking entirely so the model replies on the first token.
    if (model.includes("3.1")) {
      lockedConfig.thinkingConfig = { thinkingLevel: "minimal" };
    } else {
      lockedConfig.thinkingConfig = { thinkingBudget: 0 };
    }

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + SESSION_WINDOW_MS).toISOString(),
        newSessionExpireTime: new Date(now + NEW_SESSION_WINDOW_MS).toISOString(),
        liveConnectConstraints: {
          model,
          config: lockedConfig,
        },
        httpOptions: { apiVersion: "v1alpha" },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const name = (token as any)?.name as string | undefined;
    if (!name) {
      console.error("[gemini-token] mint returned no name:", token);
      return Response.json(
        { error: "Failed to mint ephemeral token" },
        { status: 502 },
      );
    }
    return Response.json({ token: name });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[gemini-token] mint failed:", err);
    return Response.json(
      { error: `Token mint failed: ${message}` },
      { status: 502 },
    );
  }
}
