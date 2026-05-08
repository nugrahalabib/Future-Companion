// Gemini function declarations the companion can call during the encounter.
//
// Real smart-home calls (control_smart_home, query_smart_home,
// list_smart_devices) are dispatched server-side via /api/companion-tools/
// execute so credentials stay on the server and the AI gets a synchronous
// confirmation it can verbalize. The remaining tools (set_reminder,
// check_weather) are mock-only — kept around for demo color.

export const COMPANION_FUNCTION_DECLARATIONS = [
  {
    name: "list_smart_devices",
    description:
      "List the owner's smart-home devices currently linked through Tuya Cloud. Call this once if you don't already know what devices exist before invoking control_smart_home. Returns an array of device names with capability hints (on/off, brightness, color).",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "control_smart_home",
    description:
      "Adjust the owner's real smart-home lights through Tuya Cloud. Call this PROACTIVELY whenever the conversation's mood shifts — without waiting for an explicit command. Examples of when to fire (not exhaustive): topic turns intimate or romantic → red/passion, user is sad/heartbroken → calm blue dim, user wants to vent → warm cozy + turn off the bedside lamp, user is focusing/working → bright white, user is sleepy → very dim red, user is happy/celebrating → party vibrant, user starts a movie → dim or off. Composite scenes are encouraged: call this tool MULTIPLE TIMES in the same turn (e.g. 'lampu tidur' → off, then 'all lights' → warm dim). Verbalize the change as part of natural conversation, e.g. 'I'm shifting the lights to red so it feels more intimate' — never 'command executed'. You have FULL FREEDOM to pick the brightness and color that fits the moment; don't ask permission first.",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description:
            "Device name exactly as listed in the device inventory (e.g. 'soft box 1', 'lampu meja', 'lampu tidur', 'lampu strip dinding'), OR a group keyword: 'all lights' / 'semua lampu' (every light), 'all' (every device). Partial substrings also match — e.g. 'lampu' matches every device with 'lampu' in its name.",
        },
        action: {
          type: "string",
          description:
            "'on' | 'off' | 'set'. Use 'set' when you only want to change brightness/color/temperature without explicitly toggling power (the device is auto-turned-on first if it's off so the change is visible).",
        },
        brightness: {
          type: "number",
          description:
            "Optional 0-100 percent brightness. Mid (40-60) for vent/calm, low (15-25) for sleep/movie, high (80-100) for focus/celebrate. Only meaningful for dimmable lights.",
        },
        color: {
          type: "string",
          description:
            "Optional color name. Pure spectrum: red, orange, yellow, green, cyan, blue, purple, pink, white. Mood presets you should reach for first: 'red' or 'passion' or 'intimate' (intimate/romantic), 'warm' or 'cozy' (vent/cuddle/cold), 'calm' or 'sad' (sad/melancholy), 'focus' (work/study), 'sleep' or 'dim' (sleep/movie), 'party' (celebrate). Indonesian names accepted too (merah, biru, hangat, romantis, fokus, tidur, panas).",
        },
        temperature: {
          type: "number",
          description:
            "Optional 0-100 color temperature where 0=warm and 100=cool. Only for lights that have a white-mode temp slider. Skip this when you're using `color` — pick one or the other.",
        },
      },
      required: ["target", "action"],
    },
  },
  {
    name: "query_smart_home",
    description:
      "Read current state of the owner's smart-home devices (on/off, brightness, color mode). Use to answer 'are the lights on?' / 'what color is the lamp?' / 'lampu mana yang nyala?'.",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description:
            "Optional device name or group keyword. Omit to query everything.",
        },
      },
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

// Tool dispatcher. Routes smart-home tools to the server (real Tuya calls
// are too sensitive to run from a browser-bound API key), and resolves the
// remaining mock tools locally.
export async function runCompanionTool(
  name: string,
  args: Record<string, unknown>,
  onEvent?: (ev: ToolEvent) => void,
): Promise<Record<string, unknown>> {
  let result: Record<string, unknown> = { ok: true };

  if (name === "list_smart_devices" || name === "control_smart_home" || name === "query_smart_home") {
    try {
      const res = await fetch("/api/companion-tools/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, args }),
      });
      const data = (await res.json()) as Record<string, unknown>;
      result = data;
    } catch (err) {
      result = {
        ok: false,
        error: err instanceof Error ? err.message : "Network error talking to smart-home dispatcher",
      };
    }
  } else {
    switch (name) {
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
