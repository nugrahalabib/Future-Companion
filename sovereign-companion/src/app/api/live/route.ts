/**
 * Server-side Gemini Live API proxy via WebSocket.
 *
 * Mirrors the Shila pattern (Python `client.aio.live.connect()` server-side
 * with master key + tools embedded directly in LiveConnectConfig). The
 * browser becomes a thin client: it streams raw PCM audio to us and we
 * forward to Google Live; we receive audio + tool calls from Live and
 * pipe back to the browser. Tool calls fire server-side directly against
 * the existing Tuya manager — no HTTP round-trip, no ephemeral-token
 * lock-config gymnastics.
 *
 * Why this architecture:
 *   - Browser-direct ephemeral tokens silently drop tools in some
 *     SDK/model combinations (we hit this with native-audio + tools).
 *   - Master key never leaves the server.
 *   - Tool dispatch is co-located with the Tuya client (already on the
 *     server) so latency is minimal.
 *
 * Wire protocol (browser <-> us):
 *
 *   Browser -> us:
 *     1st JSON message: {type:"start", userId, voice, locale, companionConfig}
 *     binary frames:    raw PCM Int16 LE @ 16kHz mono (mic capture)
 *     JSON {type:"end"}: graceful close
 *
 *   us -> Browser:
 *     {type:"ready"}                              : Live session opened
 *     {type:"input_transcript", text}             : user speech transcribed
 *     {type:"output_transcript", text}            : companion speech transcribed
 *     {type:"interrupted"}                        : user barged in
 *     {type:"tool", name, args, result}           : tool call observed
 *     {type:"turn_complete"}                      : turn done
 *     {type:"error", message}                     : fatal error
 *     binary frames:                              : PCM audio @ 24kHz mono
 */

import type { NextRequest } from "next/server";
import type { WebSocket as WS, WebSocketServer } from "ws";
import { GoogleGenAI } from "@google/genai";
import type { LiveServerMessage, Session } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt, type CompanionConfig } from "@/lib/systemPromptBuilder";
import { loadOverrides } from "@/lib/systemPromptOverrides";
import { listDeviceNamesForAi } from "@/lib/tuya/manager";
import { COMPANION_FUNCTION_DECLARATIONS } from "@/lib/companionTools";
import { dispatchTool } from "@/lib/liveToolDispatch";
import { getDemoStatus } from "@/lib/demoMode";

export const runtime = "nodejs";

interface StartMessage {
  type: "start";
  userId: string;
  voice?: string;
  locale?: "id" | "en";
  companionConfig: CompanionConfig;
  model?: string;
  languageCode?: string;
}

const DEFAULT_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

function safeSend(client: WS, payload: unknown): void {
  if (client.readyState !== 1) return;
  try {
    client.send(typeof payload === "string" ? payload : JSON.stringify(payload));
  } catch (err) {
    console.warn("[live] safeSend failed:", err);
  }
}

function safeSendBinary(client: WS, data: Uint8Array): void {
  if (client.readyState !== 1) return;
  try {
    client.send(data, { binary: true });
  } catch (err) {
    console.warn("[live] safeSendBinary failed:", err);
  }
}

// next-ws contract: export an UPGRADE function from a route file.
export async function UPGRADE(
  client: WS,
  _server: WebSocketServer,
  _request: NextRequest,
): Promise<void> {
  console.log("[live] client connected");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    safeSend(client, { type: "error", message: "GEMINI_API_KEY missing on server" });
    client.close(1011);
    return;
  }

  const status = await getDemoStatus();
  if (!status.active) {
    safeSend(client, { type: "error", message: status.message ?? "Demo paused" });
    client.close(1008);
    return;
  }

  let session: Session | null = null;
  let sessionClosed = false;

  // Wait for the start message before connecting upstream — we need
  // userId + companion config to build the system prompt.
  client.once("message", async (raw: unknown) => {
    let parsed: StartMessage;
    try {
      const text =
        typeof raw === "string"
          ? raw
          : Buffer.isBuffer(raw)
            ? raw.toString("utf8")
            : raw instanceof ArrayBuffer
              ? Buffer.from(raw).toString("utf8")
              : "";
      parsed = JSON.parse(text) as StartMessage;
    } catch {
      safeSend(client, { type: "error", message: "first message must be JSON {type:'start',...}" });
      client.close(1003);
      return;
    }
    if (parsed.type !== "start" || !parsed.userId || !parsed.companionConfig) {
      safeSend(client, { type: "error", message: "missing userId or companionConfig" });
      client.close(1003);
      return;
    }

    // Verify caller has completed creator flow.
    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
      include: { companionConfig: true },
    });
    if (!user || !user.companionConfig) {
      safeSend(client, { type: "error", message: "invalid_user_or_no_companion" });
      client.close(1008);
      return;
    }

    // Build the live system prompt with admin overrides + Tuya device list.
    const locale = parsed.locale === "en" ? "en" : "id";
    let systemPrompt = "";
    try {
      const overrides = await loadOverrides();
      const deviceNames = await listDeviceNamesForAi();
      const deviceList = deviceNames.length ? deviceNames.map((n) => `- ${n}`).join("\n") : "";
      systemPrompt = buildSystemPrompt(parsed.companionConfig, locale, overrides, { deviceList });
    } catch (err) {
      console.warn("[live] prompt build failed:", err);
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1alpha" },
    });

    const model = parsed.model || DEFAULT_MODEL;
    const voiceName = parsed.voice || "Kore";

    // Forward Live messages to browser. Tool calls are intercepted and
    // dispatched server-side; the response is sent back to Live so the
    // model can continue the turn naturally.
    const onMessage = async (msg: LiveServerMessage) => {
      try {
        // Tool calls — dispatch each, send results back to Live, also
        // forward observation events to the browser for UI overlay.
        if (msg.toolCall?.functionCalls && msg.toolCall.functionCalls.length > 0) {
          console.log(
            "[live] tool call from model:",
            msg.toolCall.functionCalls.map((c) => `${c.name}(${JSON.stringify(c.args)})`).join(", "),
          );
          const responses: Array<{ id?: string; name: string; response: Record<string, unknown> }> = [];
          for (const call of msg.toolCall.functionCalls) {
            if (!call.name) continue;
            const result = await dispatchTool(call.name, (call.args as Record<string, unknown>) ?? {});
            responses.push({ id: call.id, name: call.name, response: result });
            safeSend(client, {
              type: "tool",
              name: call.name,
              args: call.args ?? {},
              result,
            });
          }
          if (session && responses.length > 0 && !sessionClosed) {
            try {
              session.sendToolResponse({ functionResponses: responses });
              console.log(`[live] sent ${responses.length} tool response(s) to model`);
            } catch (err) {
              console.warn("[live] sendToolResponse failed:", err);
            }
          }
        }

        // Server content: transcripts, audio, interruption, turn-complete.
        const sc = msg.serverContent;
        if (sc) {
          if (sc.interrupted) {
            safeSend(client, { type: "interrupted" });
          }
          if (sc.inputTranscription?.text) {
            safeSend(client, {
              type: "input_transcript",
              text: sc.inputTranscription.text,
            });
          }
          if (sc.outputTranscription?.text) {
            safeSend(client, {
              type: "output_transcript",
              text: sc.outputTranscription.text,
            });
          }
          if (sc.turnComplete) {
            safeSend(client, { type: "turn_complete" });
          }
          // Audio frames live under modelTurn.parts[].inlineData.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const parts = (sc as any).modelTurn?.parts as
            | Array<{ inlineData?: { data?: string; mimeType?: string } }>
            | undefined;
          if (parts) {
            for (const part of parts) {
              const data = part.inlineData?.data;
              if (data) {
                // Decode base64 → bytes → forward as binary frame.
                const bytes = Buffer.from(data, "base64");
                safeSendBinary(client, bytes);
              }
            }
          }
        }
      } catch (err) {
        console.error("[live] onMessage handler failed:", err);
      }
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const liveConfig: any = {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        // Tools attach DIRECTLY to the live config — no ephemeral
        // token gymnastics. This is the path Shila uses successfully.
        tools: [{ functionDeclarations: COMPANION_FUNCTION_DECLARATIONS }],
        toolConfig: { functionCallingConfig: { mode: "AUTO" } },
      };
      if (parsed.languageCode) {
        liveConfig.speechConfig.languageCode = parsed.languageCode;
      }
      if (systemPrompt) {
        liveConfig.systemInstruction = { parts: [{ text: systemPrompt }] };
      }
      // Latency knob — match Shila (no thinkingConfig) for native-audio so
      // the model has full budget to plan tool calls.
      if (model.includes("3.1")) {
        liveConfig.thinkingConfig = { thinkingLevel: "minimal" };
      }

      session = await ai.live.connect({
        model,
        config: liveConfig,
        callbacks: {
          onopen: () => {
            console.log("[live] upstream Gemini Live connected");
            safeSend(client, { type: "ready" });
          },
          onmessage: (m) => {
            void onMessage(m);
          },
          onerror: (e) => {
            console.error("[live] upstream error:", e);
            safeSend(client, {
              type: "error",
              message: e instanceof Error ? e.message : "upstream error",
            });
          },
          onclose: (e) => {
            console.log("[live] upstream closed:", e?.reason ?? "no reason");
            sessionClosed = true;
            try {
              client.close(1000, "upstream_closed");
            } catch {}
          },
        },
      });
    } catch (err) {
      console.error("[live] failed to open upstream:", err);
      safeSend(client, {
        type: "error",
        message: err instanceof Error ? err.message : "upstream connect failed",
      });
      client.close(1011);
      return;
    }

    // Browser -> Live audio + control messages.
    // ws library emits Buffer for binary frames, string for text frames; the
    // type annotation here is `unknown` because TS struggles with the
    // overload narrowing.
    client.on("message", (frame: unknown) => {
      if (!session || sessionClosed) return;
      // Binary frame = PCM audio chunk.
      if (Buffer.isBuffer(frame)) {
        const base64 = frame.toString("base64");
        try {
          session.sendRealtimeInput({
            audio: { data: base64, mimeType: "audio/pcm;rate=16000" },
          });
        } catch (err) {
          console.warn("[live] sendRealtimeInput failed:", err);
        }
        return;
      }
      // Text frame = control message (end-of-turn marker, etc).
      const text =
        typeof frame === "string"
          ? frame
          : frame instanceof ArrayBuffer
            ? Buffer.from(frame).toString("utf8")
            : "";
      if (!text) return;
      try {
        const ctrl = JSON.parse(text) as { type?: string };
        if (ctrl.type === "audio_end") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (session as any).sendRealtimeInput({ audioStreamEnd: true });
        }
      } catch {
        // ignore malformed control frames
      }
    });
  });

  client.on("close", () => {
    console.log("[live] client disconnected");
    sessionClosed = true;
    if (session) {
      try {
        session.close();
      } catch {}
    }
  });

  client.on("error", (err: Error) => {
    console.warn("[live] client socket error:", err.message);
  });
}
