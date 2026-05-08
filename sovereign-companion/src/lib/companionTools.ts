// Gemini function declarations the companion can call during the encounter.
// Handlers return deterministic, demo-friendly payloads and fire lightweight
// UI events so the overlay can visualize the action (smart-home glow, etc.).
//
// All handlers are pure + synchronous-feeling (no network) so the booth demo
// never stalls on a flaky call.

export const COMPANION_FUNCTION_DECLARATIONS = [
  {
    name: "set_smart_home",
    description:
      "Control a simulated smart-home device in the owner's suite. Use when the user asks the companion to turn lights/music/scent on or off, or set a room's mood.",
    parameters: {
      type: "object",
      properties: {
        device: {
          type: "string",
          enum: ["lights", "music", "ambient_scent", "blinds", "climate"],
          description: "Which device to control.",
        },
        action: {
          type: "string",
          enum: ["on", "off", "dim", "brighten", "play", "pause", "open", "close"],
          description: "What to do with the device.",
        },
        intensity: {
          type: "number",
          description: "Optional 0-100 level for dimmable / adjustable devices.",
        },
        note: {
          type: "string",
          description: "Short human-readable note for the UI overlay (<= 60 chars).",
        },
      },
      required: ["device", "action"],
    },
  },
  {
    name: "set_reminder",
    description:
      "Schedule a short reminder for the owner. Use when the user asks the companion to remind them of something during this session.",
    parameters: {
      type: "object",
      properties: {
        topic: { type: "string", description: "What to remind about." },
        inMinutes: {
          type: "number",
          description: "How many minutes from now to deliver the reminder (1-120).",
        },
      },
      required: ["topic", "inMinutes"],
    },
  },
  {
    name: "check_weather",
    description:
      "Return a simulated weather snapshot for the owner's current city. Use when the user asks about the weather.",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string", description: "Target city name." },
      },
      required: ["city"],
    },
  },
] as const;

export interface ToolEvent {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  timestamp: number;
}

const WEATHER_FIXTURES = [
  { summary: "Clear skies", tempC: 28, humidity: 62 },
  { summary: "Light rain", tempC: 24, humidity: 84 },
  { summary: "Warm and hazy", tempC: 31, humidity: 58 },
  { summary: "Cool breeze", tempC: 22, humidity: 70 },
  { summary: "Thunderstorms easing", tempC: 26, humidity: 88 },
];

export async function runCompanionTool(
  name: string,
  args: Record<string, unknown>,
  onEvent?: (ev: ToolEvent) => void,
): Promise<Record<string, unknown>> {
  let result: Record<string, unknown> = { ok: true };

  switch (name) {
    case "set_smart_home": {
      const device = String(args.device ?? "lights");
      const action = String(args.action ?? "on");
      const intensity = typeof args.intensity === "number" ? args.intensity : undefined;
      result = {
        ok: true,
        device,
        action,
        intensity,
        message: `${device} ${action}${intensity !== undefined ? ` at ${intensity}%` : ""}`,
      };
      break;
    }
    case "set_reminder": {
      const topic = String(args.topic ?? "");
      const inMinutes = Number(args.inMinutes ?? 5);
      result = {
        ok: true,
        scheduled: true,
        topic,
        deliverAt: new Date(Date.now() + inMinutes * 60_000).toISOString(),
      };
      break;
    }
    case "check_weather": {
      const city = String(args.city ?? "Jakarta");
      const fixture = WEATHER_FIXTURES[Math.floor(Math.random() * WEATHER_FIXTURES.length)];
      result = {
        ok: true,
        city,
        ...fixture,
      };
      break;
    }
    default:
      result = { ok: false, error: `Unknown tool: ${name}` };
  }

  const event: ToolEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    args,
    result,
    timestamp: Date.now(),
  };
  onEvent?.(event);
  return result;
}
