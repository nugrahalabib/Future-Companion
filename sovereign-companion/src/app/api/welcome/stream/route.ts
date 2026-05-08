/**
 * Server-Sent Events endpoint. Pages on port 2970 (and elsewhere in the
 * booth) subscribe here so that when the public welcome button is
 * pressed, every browser tab can react in lock-step:
 *
 *   - kiosk pages reset to /
 *   - the active encounter ends gracefully
 *   - admin tabs stay put (filtered client-side)
 *
 * The connection is held open until the client navigates away. We emit
 * a heartbeat comment every 25s so proxies don't drop the idle TCP.
 */

import type { NextRequest } from "next/server";
import { subscribe, unsubscribe } from "@/lib/welcomeBus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const entry = subscribe(controller);

      // Initial frames so EventSource onopen fires reliably and so the
      // browser knows to reconnect after 5s if the connection drops.
      controller.enqueue(encoder.encode("retry: 5000\n\n"));
      controller.enqueue(encoder.encode("event: ready\ndata: {}\n\n"));

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe(entry);
        try {
          controller.close();
        } catch {
          // already closed — ignore
        }
      };

      // The runtime fires AbortSignal on the request when the client
      // disconnects. That's our cue to drop the subscription.
      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering for SSE
    },
  });
}
