"use client";

import { useCallback, useRef } from "react";
import { base64ToAudioChunk } from "@/lib/audioUtils";

export function useAudioPlayer() {
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTimeRef = useRef(0);
  // Track every scheduled buffer so we can stop them all on interruption.
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const getAnalyser = useCallback(() => {
    return analyserRef.current;
  }, []);

  const init = useCallback(() => {
    if (contextRef.current) return;
    const ctx = new AudioContext({ sampleRate: 24000 });
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.connect(ctx.destination);
    contextRef.current = ctx;
    analyserRef.current = analyser;
    nextStartTimeRef.current = ctx.currentTime;
  }, []);

  const playChunk = useCallback((base64Audio: string) => {
    const ctx = contextRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    const float32 = base64ToAudioChunk(base64Audio);
    if (float32.length === 0) return;

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser);

    // Gapless scheduling — always schedule at or after the previous buffer's end.
    const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;

    activeSourcesRef.current.add(source);
    source.onended = () => {
      activeSourcesRef.current.delete(source);
    };
  }, []);

  // Immediate stop of all pending audio — used when server signals `interrupted`
  // (user barge-in) so the companion doesn't keep talking over the user.
  const flushQueue = useCallback(() => {
    const ctx = contextRef.current;
    const sources = Array.from(activeSourcesRef.current);
    activeSourcesRef.current.clear();
    for (const source of sources) {
      try {
        source.onended = null;
        source.stop(0);
        source.disconnect();
      } catch {
        // Already stopped — ignore
      }
    }
    if (ctx) {
      nextStartTimeRef.current = ctx.currentTime;
    }
  }, []);

  const suspend = useCallback(async () => {
    if (contextRef.current && contextRef.current.state === "running") {
      await contextRef.current.suspend();
    }
  }, []);

  const resume = useCallback(async () => {
    if (contextRef.current && contextRef.current.state === "suspended") {
      await contextRef.current.resume();
      nextStartTimeRef.current = contextRef.current.currentTime;
    }
  }, []);

  const close = useCallback(() => {
    flushQueue();
    if (contextRef.current) {
      contextRef.current.close();
      contextRef.current = null;
      analyserRef.current = null;
    }
  }, [flushQueue]);

  return { init, playChunk, close, getAnalyser, suspend, resume, flushQueue };
}
