"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CompanionConfig } from "@/lib/systemPromptBuilder";

// We connect via our own WebSocket proxy (/api/live) — the master Gemini
// API key never leaves the server, and tools attach directly to the live
// session there (mirrors Shila's pattern). The browser becomes a thin
// audio I/O client.

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
  userId: string;
  // Kept for compatibility with the encounter page; the server now builds
  // the system prompt from companionConfigForRebuild + admin overrides.
  systemPrompt?: string;
  voiceName: string;
  languageCode: string;
  // The server uses this + the active admin override template to build the
  // live system prompt at session-start time (hot-reload of /admin/prompt).
  companionConfigForRebuild?: Record<string, unknown>;
  rebuildLocale?: "en" | "id";
  model?: GeminiLiveModel;
  enableAffectiveFeatures?: boolean;
  // Function declarations the model can call. The server already knows
  // them via COMPANION_FUNCTION_DECLARATIONS — this prop is kept for API
  // compatibility but not used anymore.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functionDeclarations?: any[];
  onAudioOutput?: (base64Audio: string) => void;
  onTranscript?: (role: "user" | "companion", text: string, isFinal?: boolean) => void;
  onInterrupted?: () => void;
  onTurnComplete?: () => void;
  onGenerationComplete?: () => void;
  onGoAway?: (timeLeft?: string) => void;
  // The server dispatches tools itself. This callback is fired locally so
  // the encounter UI can still show a "Tool: control_smart_home(...)" badge
  // — the server's result is what actually controlled the device.
  onFunctionCall?: (name: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  onError?: (error: string) => void;
  onPhaseChange?: (phase: ConnectionPhase) => void;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function buildLiveSocketUrl(): string {
  if (typeof window === "undefined") return "";
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/api/live`;
}

export function useGeminiLive(options: UseGeminiLiveOptions) {
  const {
    userId,
    voiceName,
    languageCode,
    companionConfigForRebuild,
    rebuildLocale = "id",
    model = "gemini-2.5-flash-native-audio-preview-12-2025",
  } = options;

  const [phase, setPhase] = useState<ConnectionPhase>("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const shouldReconnectRef = useRef<boolean>(false);
  const reconnectAttemptsRef = useRef<number>(0);
  const connectedOnceRef = useRef<boolean>(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_RECONNECT_ATTEMPTS = 3;

  const handlersRef = useRef(options);
  useEffect(() => {
    handlersRef.current = options;
  });

  const setPhaseSafe = useCallback((next: ConnectionPhase) => {
    setPhase(next);
    handlersRef.current.onPhaseChange?.(next);
  }, []);

  const openSocketRef = useRef<() => Promise<void>>(async () => {});

  const openSocket = useCallback(async () => {
    setPhaseSafe("connecting");
    const url = buildLiveSocketUrl();
    if (!url) {
      handlersRef.current.onError?.("Cannot build /api/live URL (window unavailable)");
      setPhaseSafe("error");
      return;
    }
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";
    } catch (err) {
      handlersRef.current.onError?.(
        `WebSocket init failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      setPhaseSafe("error");
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      console.debug("[live] socket open, sending start");
      const startPayload = {
        type: "start" as const,
        userId,
        voice: voiceName,
        locale: rebuildLocale,
        languageCode: languageCode || undefined,
        model,
        companionConfig: companionConfigForRebuild as CompanionConfig | undefined,
      };
      try {
        ws.send(JSON.stringify(startPayload));
      } catch (err) {
        console.warn("[live] start send failed:", err);
      }
    };

    ws.onmessage = (ev: MessageEvent) => {
      // Binary frame = PCM audio out from companion. Convert to base64
      // so the existing AudioPlayer (which decodes from base64) works.
      if (ev.data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(ev.data);
        const base64 = bytesToBase64(bytes);
        handlersRef.current.onAudioOutput?.(base64);
        return;
      }
      // Text frame = JSON event.
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(typeof ev.data === "string" ? ev.data : "");
      } catch {
        return;
      }
      const type = payload.type as string;
      const h = handlersRef.current;
      switch (type) {
        case "ready":
          console.debug("[live] upstream ready");
          connectedOnceRef.current = true;
          reconnectAttemptsRef.current = 0;
          setPhaseSafe("connected");
          break;
        case "input_transcript":
          h.onTranscript?.("user", String(payload.text ?? ""), false);
          break;
        case "output_transcript":
          h.onTranscript?.("companion", String(payload.text ?? ""), false);
          break;
        case "tool":
          // The server already dispatched and applied the tool. We surface
          // the event to the encounter UI so the badge / overlay shows it.
          if (h.onFunctionCall) {
            // Not an actual call — we already have the result. We just want
            // the UI overlay to render. We resolve immediately so it doesn't
            // block anything.
            void h.onFunctionCall(
              String(payload.name ?? ""),
              (payload.args as Record<string, unknown>) ?? {},
            ).catch(() => undefined);
          }
          console.log(
            `[live] tool ${payload.name}(${JSON.stringify(payload.args)}) →`,
            payload.result,
          );
          break;
        case "interrupted":
          h.onInterrupted?.();
          break;
        case "turn_complete":
          h.onTurnComplete?.();
          break;
        case "error": {
          const msg = String(payload.message ?? "unknown error");
          console.error("[live] server error:", msg);
          h.onError?.(msg);
          break;
        }
        default:
          break;
      }
    };

    ws.onerror = (ev) => {
      console.error("[live] socket error:", ev);
    };

    ws.onclose = (ev) => {
      wsRef.current = null;
      const userInitiated = !shouldReconnectRef.current;
      const isAbnormal = !userInitiated && ev.code !== 1000;
      const everConnected = connectedOnceRef.current;
      const attempts = reconnectAttemptsRef.current;
      const canRetry =
        shouldReconnectRef.current &&
        isAbnormal &&
        everConnected &&
        attempts < MAX_RECONNECT_ATTEMPTS;

      if (userInitiated) {
        console.log("[live] socket closed cleanly", ev.code);
      } else {
        console.warn("[live] socket closed:", ev.code, ev.reason);
      }

      if (isAbnormal && !canRetry) {
        const friendly = !everConnected
          ? `Live proxy failed to open. Cek log dev server di /api/live.`
          : `Live proxy disconnected after ${attempts} retries. Stopping.`;
        handlersRef.current.onError?.(friendly);
      }

      if (canRetry) {
        reconnectAttemptsRef.current = attempts + 1;
        setPhaseSafe("reconnecting");
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        const backoff = 500 * Math.pow(2, attempts);
        reconnectTimerRef.current = setTimeout(() => {
          void openSocketRef.current();
        }, backoff);
      } else {
        shouldReconnectRef.current = false;
        setPhaseSafe(isAbnormal ? "error" : "closed");
      }
    };
  }, [
    userId,
    voiceName,
    languageCode,
    rebuildLocale,
    model,
    companionConfigForRebuild,
    setPhaseSafe,
  ]);

  useEffect(() => {
    openSocketRef.current = openSocket;
  }, [openSocket]);

  const connect = useCallback(async () => {
    shouldReconnectRef.current = true;
    connectedOnceRef.current = false;
    reconnectAttemptsRef.current = 0;
    await openSocket();
  }, [openSocket]);

  const sendAudio = useCallback((base64PcmChunk: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      // Decode base64 → bytes → send as binary frame.
      const binaryStr = atob(base64PcmChunk);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      ws.send(bytes);
    } catch (err) {
      console.warn("[live] sendAudio failed:", err);
    }
  }, []);

  const endAudioStream = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify({ type: "audio_end" }));
    } catch {}
  }, []);

  const sendText = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try {
      ws.send(JSON.stringify({ type: "text", text }));
    } catch {}
  }, []);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    const ws = wsRef.current;
    if (ws) {
      try {
        ws.close(1000, "user_disconnect");
      } catch {}
      wsRef.current = null;
    }
    setPhaseSafe("closed");
  }, [setPhaseSafe]);

  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
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
