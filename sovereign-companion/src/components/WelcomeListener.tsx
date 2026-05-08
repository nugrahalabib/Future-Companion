"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Subscribes every browser tab to /api/welcome/stream so that when the
 * public welcome trigger fires, kiosk pages reset to "/" — clearing any
 * half-finished registration / creator / encounter / checkout state.
 *
 * Excluded from the reset:
 *   - /admin/*          (operator workspaces)
 *   - /questionnaire/*  (active questionnaire — must not lose responses)
 *   - /welcome          (the trigger surface itself)
 *
 * Mounted once at the root layout. Maintains a single EventSource for
 * the lifetime of the tab and reconnects automatically (browser default
 * behavior + retry hint we send from /api/welcome/stream).
 */
export default function WelcomeListener() {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  // Keep pathname in a ref so the effect's onmessage handler never goes
  // stale between navigations. We mount the EventSource once for the
  // lifetime of the tab.
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof EventSource === "undefined") return;

    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/welcome/stream");
    } catch {
      return;
    }

    const handleEvent = (raw: MessageEvent) => {
      let payload: { type?: string };
      try {
        payload = JSON.parse(raw.data ?? "{}");
      } catch {
        return;
      }
      if (payload.type !== "welcome") return;

      const path = pathnameRef.current ?? "/";
      // Don't disrupt admin or active questionnaire work.
      const isProtected =
        path.startsWith("/admin") ||
        path.startsWith("/questionnaire") ||
        path.startsWith("/welcome");
      if (isProtected) return;
      if (path === "/") return;

      console.log("[welcome-listener] welcome event — bouncing to /");
      // Navigation only — local stores reset themselves on the landing
      // page CTA already; the welcome ceremony is exit-back-to-start.
      router.replace("/");
    };

    es.addEventListener("message", handleEvent);
    es.addEventListener("error", () => {
      // Browser will reconnect automatically per the retry hint.
    });

    return () => {
      try {
        es?.close();
      } catch {}
    };
  }, [router]);

  return null;
}
