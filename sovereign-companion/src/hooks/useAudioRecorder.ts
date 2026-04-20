"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { audioChunkToBase64, int16ToBase64 } from "@/lib/audioUtils";

interface UseAudioRecorderOptions {
  onAudioChunk: (base64Chunk: string) => void;
}

// 30ms chunks via AudioWorklet (preferred) or 4096-sample ScriptProcessor fallback.
// Smaller chunks let Gemini's server-side VAD react faster → much lower perceived latency.
export function useAudioRecorder({ onAudioChunk }: UseAudioRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const levelRef = useRef<number>(0);
  const mutedRef = useRef<boolean>(false);
  const onChunkRef = useRef(onAudioChunk);
  useEffect(() => {
    onChunkRef.current = onAudioChunk;
  });

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 16000 });
      contextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      let usedWorklet = false;
      if (ctx.audioWorklet && typeof ctx.audioWorklet.addModule === "function") {
        try {
          await ctx.audioWorklet.addModule("/audio-worklets/recorder-worklet.js");
          const node = new AudioWorkletNode(ctx, "recorder-processor", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            channelCount: 1,
          });
          node.port.onmessage = (e: MessageEvent) => {
            const data = e.data as { type: string; pcm: ArrayBuffer; rms: number };
            if (data.type !== "chunk") return;
            // Smooth level meter
            const prev = levelRef.current;
            levelRef.current = prev + (data.rms - prev) * 0.35;
            if (mutedRef.current) return;
            const int16 = new Int16Array(data.pcm);
            onChunkRef.current(int16ToBase64(int16));
          };
          source.connect(node);
          // Worklet must be connected to destination for `process()` to run,
          // but we don't want to play mic back to speakers — route to a muted gain.
          const silentGain = ctx.createGain();
          silentGain.gain.value = 0;
          node.connect(silentGain);
          silentGain.connect(ctx.destination);
          workletNodeRef.current = node;
          usedWorklet = true;
        } catch (err) {
          console.warn("AudioWorklet unavailable — falling back to ScriptProcessor", err);
        }
      }

      if (!usedWorklet) {
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
          const rms = Math.sqrt(sum / inputData.length);
          const prev = levelRef.current;
          levelRef.current = prev + (rms - prev) * 0.35;
          if (mutedRef.current) return;
          const chunk = new Float32Array(inputData);
          onChunkRef.current(audioChunkToBase64(chunk));
        };
        source.connect(processor);
        processor.connect(ctx.destination);
      }

      setIsRecording(true);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Izin mikrofon ditolak. Aktifkan mikrofon di pengaturan browser Anda."
          : err instanceof DOMException && err.name === "NotFoundError"
            ? "Mikrofon tidak ditemukan. Pastikan perangkat terhubung."
            : "Gagal mengakses mikrofon. Silakan coba lagi.";
      setError(message);
      throw new Error(message);
    }
  }, []);

  const stop = useCallback(() => {
    if (workletNodeRef.current) {
      try {
        workletNodeRef.current.port.onmessage = null;
        workletNodeRef.current.disconnect();
      } catch {}
      workletNodeRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }
    if (contextRef.current) {
      contextRef.current.close().catch(() => {});
      contextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    levelRef.current = 0;
    setIsRecording(false);
  }, []);

  const setMuted = useCallback((m: boolean) => {
    mutedRef.current = m;
    if (m) levelRef.current = 0;
  }, []);

  const getLevel = useCallback(() => levelRef.current, []);

  return { start, stop, isRecording, error, setMuted, getLevel };
}
