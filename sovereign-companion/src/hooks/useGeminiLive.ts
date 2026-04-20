"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EndSensitivity,
  GoogleGenAI,
  type LiveServerMessage,
  Modality,
  StartSensitivity,
} from "@google/genai";

// Model alternatives (per official docs):
//   - "gemini-2.5-flash-native-audio-preview-12-2025" — expressive native-audio,
//     supports affectiveDialog + proactivity (v1alpha only).
//   - "gemini-3.1-flash-live-preview" — half-cascade, lowest round-trip latency.
export type GeminiLiveModel =
  | "gemini-2.5-flash-native-audio-preview-12-2025"
  | "gemini-3.1-flash-live-preview";

export type ConnectionPhase =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "closed"
  | "error";

export interface FunctionCallHandlerResult {
  name: string;
  response: Record<string, unknown>;
}

interface UseGeminiLiveOptions {
  systemPrompt: string;
  voiceName: string;
  languageCode: string;
  model?: GeminiLiveModel;
  // When true, uses native-audio features (affectiveDialog, proactivity).
  // Only works on native-audio models + v1alpha endpoint.
  enableAffectiveFeatures?: boolean;
  // Function declarations the model can call during the conversation.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functionDeclarations?: any[];
  onAudioOutput?: (base64Audio: string) => void;
  onTranscript?: (role: "user" | "companion", text: string, isFinal?: boolean) => void;
  onInterrupted?: () => void;
  onTurnComplete?: () => void;
  onGenerationComplete?: () => void;
  onGoAway?: (timeLeft?: string) => void;
  onFunctionCall?: (name: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  onError?: (error: string) => void;
  onPhaseChange?: (phase: ConnectionPhase) => void;
}

const SESSION_HANDLE_KEY = "sovereign-live-session-handle";

function loadSessionHandle(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(SESSION_HANDLE_KEY);
  } catch {
    return null;
  }
}

function saveSessionHandle(handle: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (handle) sessionStorage.setItem(SESSION_HANDLE_KEY, handle);
    else sessionStorage.removeItem(SESSION_HANDLE_KEY);
  } catch {}
}

// The Gemini Live SDK sometimes emits plain objects / Errors through its
// onerror / onclose callbacks — not standard ErrorEvent / CloseEvent. Walk
// every own + prototype property so we never lose diagnostic info.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dumpEvent(e: any): Record<string, unknown> {
  if (e == null) return { _: "null-or-undefined" };
  if (typeof e !== "object") return { _primitive: String(e) };
  const out: Record<string, unknown> = {};
  try {
    for (const k of Object.keys(e)) out[k] = e[k];
  } catch {}
  for (const k of ["code", "reason", "message", "type", "wasClean", "error", "name", "stack"]) {
    if (out[k] === undefined && (e as Record<string, unknown>)[k] !== undefined) {
      out[k] = (e as Record<string, unknown>)[k];
    }
  }
  if (e instanceof Error) {
    out.message = e.message;
    out.name = e.name;
    out.stack = e.stack;
  }
  try {
    out._json = JSON.stringify(e, Object.getOwnPropertyNames(e));
  } catch {}
  return out;
}

async function fetchEphemeralToken(payload: {
  model: string;
  systemPrompt?: string;
  voiceName?: string;
  languageCode?: string;
}): Promise<string | null> {
  try {
    const res = await fetch("/api/gemini-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(
        `[gemini-live] ephemeral token fetch failed (${res.status}): ${text}. Falling back to NEXT_PUBLIC_GEMINI_API_KEY.`,
      );
      return null;
    }
    const data = (await res.json()) as { token?: string };
    return data?.token ?? null;
  } catch (err) {
    console.warn("[gemini-live] ephemeral token fetch error:", err);
    return null;
  }
}

export function useGeminiLive(options: UseGeminiLiveOptions) {
  const {
    systemPrompt,
    voiceName,
    languageCode,
    model = "gemini-2.5-flash-native-audio-preview-12-2025",
    enableAffectiveFeatures = true,
    functionDeclarations,
  } = options;

  const [phase, setPhase] = useState<ConnectionPhase>("idle");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionRef = useRef<any>(null);
  const shouldReconnectRef = useRef<boolean>(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastErrorInfoRef = useRef<Record<string, unknown> | null>(null);
  // Tracks whether the session ever reached "connected". If the very first
  // connection attempt closes without ever opening, it's a config/auth
  // failure — retrying just loops forever.
  const connectedOnceRef = useRef<boolean>(false);
  const reconnectAttemptsRef = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 3;

  // Mirror latest handlers in a ref so callbacks installed on the session
  // never go stale between renders.
  const handlersRef = useRef(options);
  useEffect(() => {
    handlersRef.current = options;
  });

  // Forward-ref for openSession so onclose can call it recursively without
  // the lint "used-before-declared" rule and without a stale closure.
  const openSessionRef = useRef<() => Promise<void>>(async () => {});

  const setPhaseSafe = useCallback(
    (next: ConnectionPhase) => {
      setPhase(next);
      handlersRef.current.onPhaseChange?.(next);
    },
    [],
  );

  const buildConfig = useCallback(() => {
    // Minimal docs-verbatim shape. Once a connection succeeds, we can layer
    // transcription / VAD tuning / context compression back one at a time.
    // Start from the smallest surface area so a silent-close isn't caused by
    // a field the preview model rejects.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
      responseModalities: [Modality.AUDIO],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      // VAD tuning — the default silence threshold is ~800ms which makes the
      // gap between "user finished speaking" and "AI replies" feel sluggish.
      // HIGH end-of-speech sensitivity + 300ms silence = turn-end fires fast,
      // transcript appears fast, AI replies fast. Start sensitivity stays LOW
      // so brief pauses mid-sentence don't prematurely cut the user off.
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
          startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_LOW,
          endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
          prefixPaddingMs: 20,
          silenceDurationMs: 300,
        },
      },
    };

    // languageCode is optional — only attach if caller provided one.
    if (languageCode) {
      config.speechConfig.languageCode = languageCode;
    }

    if (functionDeclarations && functionDeclarations.length > 0) {
      config.tools = [{ functionDeclarations }];
    }

    // Note: sessionResumption / affectiveDialog / proactivity / VAD tuning
    // temporarily disabled while we stabilize the handshake. Re-add behind
    // a feature flag after confirming a clean onopen.
    void enableAffectiveFeatures;

    return config;
  }, [systemPrompt, voiceName, languageCode, enableAffectiveFeatures, functionDeclarations]);

  const handleMessage = useCallback(async (message: LiveServerMessage) => {
    const h = handlersRef.current;

    // Raw message trace — kept on during development so we can see every frame
    // the server sends (setupComplete, transcriptions, audio parts, tool calls,
    // goAway). If transcripts don't show up on screen, the raw log is the
    // authoritative source for what the server is (or isn't) emitting.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const preview: any = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const m = message as any;
      if (m.setupComplete) preview.setupComplete = true;
      if (m.serverContent) {
        const sc = m.serverContent;
        preview.serverContent = {
          hasModelTurn: !!sc.modelTurn,
          inputTranscription: sc.inputTranscription,
          outputTranscription: sc.outputTranscription,
          generationComplete: sc.generationComplete,
          turnComplete: sc.turnComplete,
          interrupted: sc.interrupted,
        };
      }
      if (m.toolCall) preview.toolCall = m.toolCall;
      if (m.goAway) preview.goAway = m.goAway;
      if (m.sessionResumptionUpdate) preview.sessionResumptionUpdate = true;
      console.debug("[gemini-live] msg", preview);
    } catch {}

    // Session resumption handle update
    if (message.sessionResumptionUpdate) {
      const update = message.sessionResumptionUpdate;
      if (update.resumable && update.newHandle) {
        saveSessionHandle(update.newHandle);
      }
    }

    // Server going away soon — preemptively reconnect
    if (message.goAway) {
      h.onGoAway?.(message.goAway.timeLeft);
      shouldReconnectRef.current = true;
      setPhaseSafe("reconnecting");
    }

    // Function calls (tool use) — execute and respond
    if (message.toolCall?.functionCalls && message.toolCall.functionCalls.length > 0) {
      const responses: FunctionCallHandlerResult[] = [];
      for (const call of message.toolCall.functionCalls) {
        if (!call.name) continue;
        try {
          const result = h.onFunctionCall
            ? await h.onFunctionCall(call.name, (call.args as Record<string, unknown>) ?? {})
            : { ok: true };
          responses.push({ name: call.name, response: result });
        } catch (err) {
          responses.push({
            name: call.name,
            response: { error: err instanceof Error ? err.message : String(err) },
          });
        }
      }
      try {
        sessionRef.current?.sendToolResponse({
          functionResponses: responses.map((r, i) => ({
            id: message.toolCall?.functionCalls?.[i]?.id,
            name: r.name,
            response: r.response,
          })),
        });
      } catch (err) {
        console.warn("Failed to send tool response:", err);
      }
    }

    const content = message.serverContent;
    if (!content) return;

    // User spoke — barge-in. Stop companion audio immediately.
    if (content.interrupted) {
      h.onInterrupted?.();
    }

    // Audio output (companion voice)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts = (content as any).modelTurn?.parts as
      | Array<{ inlineData?: { data?: string } }>
      | undefined;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          h.onAudioOutput?.(part.inlineData.data);
        }
      }
    }

    // Input transcription (what the user said)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputT = (content as any).inputTranscription;
    if (inputT?.text) {
      h.onTranscript?.("user", inputT.text, inputT.finished === true);
    }

    // Output transcription (what the companion said)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outputT = (content as any).outputTranscription;
    if (outputT?.text) {
      h.onTranscript?.("companion", outputT.text, outputT.finished === true);
    }

    if (content.generationComplete) h.onGenerationComplete?.();
    if (content.turnComplete) h.onTurnComplete?.();
  }, [setPhaseSafe]);

  const openSession = useCallback(async () => {
    try {
      setPhaseSafe("connecting");

      // Prefer ephemeral token minted server-side. Fall back to public API key
      // if the token endpoint is unavailable (dev mode, offline demo).
      const ephemeral = await fetchEphemeralToken({
        model,
        systemPrompt,
        voiceName,
        languageCode,
      });
      const apiKey = ephemeral ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey || apiKey === "your_gemini_api_key_here") {
        const msg = "Gemini API key not configured. Set GEMINI_API_KEY on the server or NEXT_PUBLIC_GEMINI_API_KEY for local dev.";
        handlersRef.current.onError?.(msg);
        setPhaseSafe("error");
        return;
      }

      // Per docs: both the ephemeral-token path AND native-audio preview
      // models require v1alpha. Keep it unconditional so 2.5-native-audio
      // never lands on the stable endpoint which rejects unknown fields.
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { apiVersion: "v1alpha" },
      });

      const config = buildConfig();
      console.debug("[gemini-live] connecting", {
        model,
        ephemeral: !!ephemeral,
        keyPreview: apiKey.slice(0, 6) + "…",
        voiceName,
        languageCode,
        hasResumptionHandle: !!loadSessionHandle(),
        configKeys: Object.keys(config),
      });
      lastErrorInfoRef.current = null;

      const session = await ai.live.connect({
        model,
        config,
        callbacks: {
          onopen: () => {
            console.debug("[gemini-live] onopen");
            connectedOnceRef.current = true;
            reconnectAttemptsRef.current = 0;
            setPhaseSafe("connected");
          },
          onmessage: (message: LiveServerMessage) => {
            void handleMessage(message);
          },
          // The @google/genai SDK does NOT always pass a standard WebSocket
          // ErrorEvent / CloseEvent — it sometimes passes a plain object or an
          // Error. Dump every enumerable prop so we can see the real reason.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onerror: (e: any) => {
            const dump = dumpEvent(e);
            console.error("[gemini-live] onerror raw:", e);
            console.error("[gemini-live] onerror dump:", dump);
            lastErrorInfoRef.current = dump;
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onclose: (e: any) => {
            sessionRef.current = null;
            const dump = dumpEvent(e);

            const code: number | undefined = typeof e?.code === "number" ? e.code : undefined;
            const dumpMsg = typeof dump.message === "string" ? dump.message : "";
            const lastMsg =
              typeof lastErrorInfoRef.current?.message === "string"
                ? (lastErrorInfoRef.current.message as string)
                : "";
            const reason: string =
              (typeof e?.reason === "string" && e.reason) ||
              dumpMsg ||
              lastMsg ||
              "";

            // User-initiated close (disconnect(), page unmount, or normal
            // end-of-turn from Gemini) comes through with shouldReconnect=false
            // and often an empty `{}` event — not an error.
            const userInitiated = !shouldReconnectRef.current;
            const isAbnormal = !userInitiated && (code === undefined || code !== 1000);
            const everConnected = connectedOnceRef.current;
            const attempts = reconnectAttemptsRef.current;
            const canRetry =
              shouldReconnectRef.current &&
              isAbnormal &&
              everConnected &&
              attempts < MAX_RECONNECT_ATTEMPTS;

            if (userInitiated) {
              console.log("[gemini-live] session closed cleanly", code ? `(code ${code})` : "");
            } else {
              console.warn("[gemini-live] onclose:", { code, reason, dump });
            }

            if (isAbnormal) {
              let friendly: string;
              if (!everConnected) {
                friendly = reason
                  ? `Gemini Live failed to open: ${reason}${code ? ` (code ${code})` : ""}. Periksa NEXT_PUBLIC_GEMINI_API_KEY / GEMINI_API_KEY dan akses preview model di Google AI Studio.`
                  : `Gemini Live failed to open. Periksa API key, akses preview model, dan log Next.js untuk /api/gemini-token.`;
              } else if (!canRetry) {
                friendly = `Gemini Live disconnected after ${attempts} reconnect attempt(s). Stopping retries.`;
              } else {
                friendly = reason
                  ? `Gemini Live disconnected: ${reason}${code ? ` (code ${code})` : ""}`
                  : `Gemini Live closed without detail. Reconnecting…`;
              }
              handlersRef.current.onError?.(friendly);
            }

            if (canRetry) {
              reconnectAttemptsRef.current = attempts + 1;
              setPhaseSafe("reconnecting");
              if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
              const backoff = 500 * Math.pow(2, attempts);
              reconnectTimerRef.current = setTimeout(() => {
                void openSessionRef.current();
              }, backoff);
            } else {
              shouldReconnectRef.current = false;
              setPhaseSafe(isAbnormal ? "error" : "closed");
              if (code === 1000 || (code && code >= 4000 && code < 5000)) {
                saveSessionHandle(null);
              }
            }
          },
        },
      });

      sessionRef.current = session;
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyErr = err as any;
      const msg =
        anyErr?.message ??
        anyErr?.error?.message ??
        (typeof err === "string" ? err : JSON.stringify(err));
      console.error("[gemini-live] connect threw:", err);
      handlersRef.current.onError?.(`Failed to connect: ${msg}`);
      setPhaseSafe("error");
    }
  }, [buildConfig, handleMessage, model, setPhaseSafe, voiceName, languageCode]);

  useEffect(() => {
    openSessionRef.current = openSession;
  }, [openSession]);

  const connect = useCallback(async () => {
    shouldReconnectRef.current = true;
    connectedOnceRef.current = false;
    reconnectAttemptsRef.current = 0;
    await openSession();
  }, [openSession]);

  const sendAudio = useCallback((base64PcmChunk: string) => {
    const session = sessionRef.current;
    if (!session) return;
    try {
      session.sendRealtimeInput({
        audio: { data: base64PcmChunk, mimeType: "audio/pcm;rate=16000" },
      });
    } catch (err) {
      console.error("Error sending audio:", err);
    }
  }, []);

  // Signal end of user audio stream — lets server finalize transcription fast.
  const endAudioStream = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    try {
      session.sendRealtimeInput({ audioStreamEnd: true });
    } catch {}
  }, []);

  // Optional: send a text-only user message (e.g., system event).
  const sendText = useCallback((text: string) => {
    const session = sessionRef.current;
    if (!session) return;
    try {
      session.sendClientContent({
        turns: [{ role: "user", parts: [{ text }] }],
        turnComplete: true,
      });
    } catch (err) {
      console.error("Error sending text:", err);
    }
  }, []);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch {}
      sessionRef.current = null;
    }
    saveSessionHandle(null);
    setPhaseSafe("closed");
  }, [setPhaseSafe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (sessionRef.current) {
        try {
          sessionRef.current.close();
        } catch {}
        sessionRef.current = null;
      }
    };
  }, []);

  return {
    connect,
    disconnect,
    sendAudio,
    sendText,
    endAudioStream,
    phase,
    isConnected: phase === "connected",
  };
}
