"use client";

import { useEffect, useState } from "react";

export interface DemoStatusClient {
  active: boolean;
  reason: "ok" | "manual_pause" | "outside_schedule";
  message: string;
  schedule: {
    enabled: boolean;
    activeFromHour: number;
    activeToHour: number;
  };
}

export function useDemoStatus(pollMs: number = 60000) {
  const [status, setStatus] = useState<DemoStatusClient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/settings/demo-status", { cache: "no-store" });
        if (!res.ok) throw new Error("fetch_failed");
        const json = (await res.json()) as DemoStatusClient;
        if (!cancelled) {
          setStatus(json);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setStatus({
            active: true,
            reason: "ok",
            message: "",
            schedule: { enabled: false, activeFromHour: 0, activeToHour: 0 },
          });
          setLoading(false);
        }
      }
    };

    load();
    const interval = setInterval(load, pollMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pollMs]);

  return { status, loading };
}
