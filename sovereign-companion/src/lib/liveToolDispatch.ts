/**
 * Server-side tool dispatcher used by the Live API WebSocket proxy. Mirrors
 * the dispatch logic in /api/companion-tools/execute but is callable
 * directly (no HTTP round-trip) so the Live session can react with minimal
 * latency.
 *
 * The AI runtime path is allowlist-aware (aiOnly=true): only Tuya devices
 * the operator has whitelisted in /admin/tuya are visible / controllable
 * to the model.
 */

import {
  executeControl,
  executeQuery,
  listDeviceNamesForAi,
  loadAllowedDevices,
} from "./tuya/manager";

const WEATHER_FIXTURES = [
  { summary: "Clear skies", tempC: 28, humidity: 62 },
  { summary: "Light rain", tempC: 24, humidity: 84 },
  { summary: "Warm and hazy", tempC: 31, humidity: 58 },
  { summary: "Cool breeze", tempC: 22, humidity: 70 },
  { summary: "Thunderstorms easing", tempC: 26, humidity: 88 },
];

export async function dispatchTool(
  name: string,
  rawArgs: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const args = rawArgs ?? {};
  console.log(`[live-tool] AI called ${name}`, JSON.stringify(args));

  if (name === "list_smart_devices") {
    const devices = await loadAllowedDevices();
    const summary = await listDeviceNamesForAi();
    return {
      ok: true,
      count: devices.length,
      devices: summary,
      message:
        devices.length === 0
          ? "No devices are whitelisted for AI control yet. Ask the booth admin to allow some in /admin/tuya."
          : `Owner has ${devices.length} device(s) connected: ${summary.join("; ")}`,
    };
  }

  if (name === "control_smart_home") {
    const target = typeof args.target === "string" ? args.target : "";
    const action = typeof args.action === "string" ? args.action : "on";
    const brightness =
      typeof args.brightness === "number"
        ? args.brightness
        : typeof args.brightness === "string"
          ? Number(args.brightness)
          : undefined;
    const color = typeof args.color === "string" ? args.color : undefined;
    const temperature =
      typeof args.temperature === "number"
        ? args.temperature
        : typeof args.temperature === "string"
          ? Number(args.temperature)
          : undefined;
    if (!target) return { ok: false, error: "target is required" };

    const result = await executeControl(
      {
        target,
        action,
        brightness: Number.isFinite(brightness) ? brightness : undefined,
        color,
        temperature: Number.isFinite(temperature) ? temperature : undefined,
      },
      true, // aiOnly
    );
    return {
      ok: result.success,
      device: result.device,
      action: result.action,
      message: result.message,
      error: result.error,
    };
  }

  if (name === "query_smart_home") {
    const target = typeof args.target === "string" ? args.target : undefined;
    const result = await executeQuery({ target }, true);
    return {
      ok: result.success,
      devices: result.devices,
      message: result.message,
    };
  }

  if (name === "set_reminder") {
    const topic = String(args.topic ?? "");
    const inMinutes = Number(args.inMinutes ?? 5);
    return {
      ok: true,
      scheduled: true,
      topic,
      deliverAt: new Date(Date.now() + inMinutes * 60_000).toISOString(),
    };
  }

  if (name === "check_weather") {
    const city = String(args.city ?? "Jakarta");
    const fixture = WEATHER_FIXTURES[Math.floor(Math.random() * WEATHER_FIXTURES.length)];
    return { ok: true, city, ...fixture };
  }

  return { ok: false, error: `Unknown tool: ${name}` };
}
