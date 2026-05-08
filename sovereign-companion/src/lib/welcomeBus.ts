/**
 * Process-wide pub/sub for the Welcome trigger event. Pages connected to
 * /api/welcome/stream register a controller here on connect; the trigger
 * route iterates them and enqueues an SSE frame to each.
 *
 * Single-process PM2 fork is fine — this state is in-memory. If the
 * deployment ever scales horizontally, swap the Set for a Redis pubsub.
 */

type SseEntry = {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
};

// We attach the registry to globalThis so Next.js dev hot-reloads don't
// drop existing subscribers — module-level state would otherwise be
// wiped on every code change.
declare global {
  // eslint-disable-next-line no-var
  var __WELCOME_BUS__:
    | { subscribers: Set<SseEntry>; nextId: number }
    | undefined;
}

const bus =
  globalThis.__WELCOME_BUS__ ?? (globalThis.__WELCOME_BUS__ = {
    subscribers: new Set<SseEntry>(),
    nextId: 1,
  });

const encoder = new TextEncoder();

export function subscribe(controller: ReadableStreamDefaultController<Uint8Array>): SseEntry {
  const entry: SseEntry = { id: `s-${bus.nextId++}`, controller };
  bus.subscribers.add(entry);
  return entry;
}

export function unsubscribe(entry: SseEntry): void {
  bus.subscribers.delete(entry);
}

export function broadcast(event: Record<string, unknown>): number {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  let sent = 0;
  for (const sub of bus.subscribers) {
    try {
      sub.controller.enqueue(encoder.encode(payload));
      sent++;
    } catch {
      // Controller closed under us — drop the dead subscriber.
      bus.subscribers.delete(sub);
    }
  }
  return sent;
}

export function subscriberCount(): number {
  return bus.subscribers.size;
}
