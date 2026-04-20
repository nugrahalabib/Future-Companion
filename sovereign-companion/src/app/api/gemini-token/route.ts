import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getDemoStatus } from "@/lib/demoMode";

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

  let model = "gemini-2.5-flash-native-audio-preview-12-2025";
  let systemPrompt: string | undefined;
  let voiceName = "Kore";
  let languageCode: string | undefined;

  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.model === "string") model = body.model;
    if (typeof body?.systemPrompt === "string") systemPrompt = body.systemPrompt;
    if (typeof body?.voiceName === "string" && body.voiceName) voiceName = body.voiceName;
    if (typeof body?.languageCode === "string" && body.languageCode) languageCode = body.languageCode;
  } catch {}

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
