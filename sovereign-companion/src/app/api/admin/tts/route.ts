/**
 * Admin TTS endpoint. Generates audio from text via Gemini's TTS models.
 *
 * Per https://ai.google.dev/gemini-api/docs/speech-generation the response
 * is base64-encoded raw PCM, signed 16-bit, mono, 24 kHz. We wrap that
 * payload in a standard WAV header here so the browser can play and
 * download the result with a single <audio src="data:..."> — no client-
 * side decoder needed. WAV is also a friendlier format for operators who
 * want to drop the file into their own pipelines.
 *
 * Two modes are supported, mirroring the docs:
 *   - single  : one prebuilt voice
 *   - multi   : two named speakers, each with their own voice
 *
 * Multi-speaker is capped at 2 (per Google's documented limitation).
 *
 * The route is fully admin-gated. Tokens spent here come out of the same
 * GEMINI_API_KEY budget as the encounter.
 */

import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { requireAdmin } from "@/lib/adminAuth";
import { isValidTtsVoice } from "@/lib/tts/voices";
import { isValidTtsLanguage } from "@/lib/tts/languages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Per Gemini docs: TTS output is signed 16-bit PCM, mono, 24 kHz.
const TTS_SAMPLE_RATE = 24000;
const TTS_BITS_PER_SAMPLE = 16;
const TTS_CHANNELS = 1;

const ALLOWED_MODELS = new Set([
  "gemini-3.1-flash-tts-preview",
  "gemini-2.5-flash-preview-tts",
  "gemini-2.5-pro-preview-tts",
]);

const MAX_TEXT_LENGTH = 8000; // ~32k tokens budget; cap chars to keep latency bounded
const MAX_SPEAKER_NAME_LENGTH = 40;

interface SpeakerSpec {
  speaker: string;
  voiceName: string;
}

interface TtsRequest {
  model?: string;
  mode?: "single" | "multi";
  text?: string;
  voiceName?: string;       // single mode
  languageCode?: string;    // optional speech-config hint (single mode)
  speakers?: SpeakerSpec[]; // multi mode (length 2)
}

// Build a 44-byte canonical RIFF/WAVE header for the given PCM payload.
function buildWavHeader(pcmByteLength: number): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = (TTS_SAMPLE_RATE * TTS_CHANNELS * TTS_BITS_PER_SAMPLE) / 8;
  const blockAlign = (TTS_CHANNELS * TTS_BITS_PER_SAMPLE) / 8;

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmByteLength, 4);   // file size - 8
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);                  // PCM fmt chunk size
  header.writeUInt16LE(1, 20);                   // audio format = PCM
  header.writeUInt16LE(TTS_CHANNELS, 22);
  header.writeUInt32LE(TTS_SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(TTS_BITS_PER_SAMPLE, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmByteLength, 40);
  return header;
}

function pcmBase64ToWavDataUrl(pcmBase64: string): string {
  const pcm = Buffer.from(pcmBase64, "base64");
  const header = buildWavHeader(pcm.length);
  const wav = Buffer.concat([header, pcm]);
  return `data:audio/wav;base64,${wav.toString("base64")}`;
}

export async function POST(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { ok: false, error: "GEMINI_API_KEY missing on server" },
      { status: 500 },
    );
  }

  let body: TtsRequest = {};
  try {
    body = (await req.json()) as TtsRequest;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // ----- Validate -----
  const model = typeof body.model === "string" ? body.model : "gemini-2.5-flash-preview-tts";
  if (!ALLOWED_MODELS.has(model)) {
    return Response.json(
      { ok: false, error: `unsupported model: ${model}` },
      { status: 400 },
    );
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return Response.json({ ok: false, error: "text is required" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return Response.json(
      { ok: false, error: `text too long (${text.length} > ${MAX_TEXT_LENGTH})` },
      { status: 400 },
    );
  }

  const mode: "single" | "multi" = body.mode === "multi" ? "multi" : "single";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let speechConfig: any;
  if (mode === "multi") {
    const speakers = Array.isArray(body.speakers) ? body.speakers : [];
    if (speakers.length !== 2) {
      return Response.json(
        { ok: false, error: "multi-speaker mode requires exactly 2 speakers" },
        { status: 400 },
      );
    }
    for (const s of speakers) {
      if (typeof s.speaker !== "string" || !s.speaker.trim()) {
        return Response.json({ ok: false, error: "speaker name required" }, { status: 400 });
      }
      if (s.speaker.length > MAX_SPEAKER_NAME_LENGTH) {
        return Response.json({ ok: false, error: "speaker name too long" }, { status: 400 });
      }
      if (typeof s.voiceName !== "string" || !isValidTtsVoice(s.voiceName)) {
        return Response.json(
          { ok: false, error: `invalid voiceName: ${s.voiceName}` },
          { status: 400 },
        );
      }
    }
    speechConfig = {
      multiSpeakerVoiceConfig: {
        speakerVoiceConfigs: speakers.map((s) => ({
          speaker: s.speaker.trim(),
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: s.voiceName },
          },
        })),
      },
    };
  } else {
    const voiceName = typeof body.voiceName === "string" ? body.voiceName : "Kore";
    if (!isValidTtsVoice(voiceName)) {
      return Response.json(
        { ok: false, error: `invalid voiceName: ${voiceName}` },
        { status: 400 },
      );
    }
    speechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName },
      },
    };
    // Optional language hint — only attach if the caller specified one
    // and it's on the supported list. The model does language detection
    // automatically; this is a hint only.
    if (typeof body.languageCode === "string" && body.languageCode) {
      if (!isValidTtsLanguage(body.languageCode)) {
        return Response.json(
          { ok: false, error: `invalid languageCode: ${body.languageCode}` },
          { status: 400 },
        );
      }
      speechConfig.languageCode = body.languageCode;
    }
  }

  // ----- Call Gemini -----
  const ai = new GoogleGenAI({ apiKey });
  let audioBase64: string | undefined;
  let mimeType: string | undefined;
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text }] }],
      config: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseModalities: ["AUDIO"] as any,
        speechConfig,
      },
    });

    // The audio is buried under candidates[0].content.parts[0].inlineData.data.
    // The SDK's typing for response is loose; we narrow defensively.
    const parts =
      response?.candidates?.[0]?.content?.parts as
        | Array<{ inlineData?: { data?: string; mimeType?: string } }>
        | undefined;
    if (!parts) {
      return Response.json(
        { ok: false, error: "model returned no parts (may have hit text-only fallback)" },
        { status: 502 },
      );
    }
    for (const p of parts) {
      if (p.inlineData?.data) {
        audioBase64 = p.inlineData.data;
        mimeType = p.inlineData.mimeType;
        break;
      }
    }
    if (!audioBase64) {
      // The model occasionally regresses to text — surface that so the
      // operator can retry instead of silent-fail.
      return Response.json(
        {
          ok: false,
          error:
            "model returned no audio (likely text-token regression — try regenerating, or simplify the prompt)",
        },
        { status: 502 },
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[tts] generateContent failed:", message);
    return Response.json({ ok: false, error: message }, { status: 502 });
  }

  // ----- Wrap PCM into WAV for browser playback / download -----
  const wavDataUrl = pcmBase64ToWavDataUrl(audioBase64);
  const pcmBytes = Buffer.from(audioBase64, "base64").length;
  const durationSeconds = pcmBytes / ((TTS_SAMPLE_RATE * TTS_BITS_PER_SAMPLE * TTS_CHANNELS) / 8);

  return Response.json({
    ok: true,
    audioDataUrl: wavDataUrl,
    sampleRate: TTS_SAMPLE_RATE,
    bitsPerSample: TTS_BITS_PER_SAMPLE,
    channels: TTS_CHANNELS,
    durationSeconds: Math.round(durationSeconds * 100) / 100,
    pcmMimeType: mimeType ?? "audio/L16;rate=24000",
    model,
    mode,
  });
}
