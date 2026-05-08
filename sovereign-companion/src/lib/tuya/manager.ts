/**
 * High-level Tuya integration — read credentials from DB, sync devices,
 * and dispatch the AI's smart-home tool calls to actual Tuya HTTP commands.
 *
 * This file is the bridge between Gemini Live's function-calling layer and
 * the low-level lib/tuya/client.ts.
 */

import { prisma } from "../prisma";
import {
  clearTuyaTokenCache,
  getDeviceSpec,
  getDeviceStatus,
  listAllDevices,
  sendDeviceCommands,
  testTuyaConnection,
} from "./client";
import { resolveColor, isWhiteMode } from "./colorMap";
import type {
  TuyaCapability,
  TuyaCommandResult,
  TuyaCredentials,
  TuyaDeviceCached,
  TuyaRegion,
} from "./types";

// ---------------------------------------------------------------------------
// Capability code heuristics — Tuya devices ship with vendor-specific codes
// so we have to detect the on/off / brightness / color codes from the spec
// instead of hard-coding switch_led.
// ---------------------------------------------------------------------------

const SWITCH_CODES = ["switch_led", "switch", "switch_1", "led_switch"];
const BRIGHTNESS_CODES = ["bright_value", "bright_value_v2", "bright_value_1"];
const COLOR_CODES = ["colour_data", "colour_data_v2", "colour_data_hsv"];
const TEMP_K_CODES = ["temp_value", "temp_value_v2", "temp_value_1"];
const MODE_CODES = ["work_mode"];

function detectCode(caps: TuyaCapability[], candidates: readonly string[]): string | null {
  for (const c of caps) {
    if (candidates.includes(c.code)) return c.code;
  }
  return null;
}

function hasCapability(caps: TuyaCapability[], candidates: readonly string[]): boolean {
  return detectCode(caps, candidates) !== null;
}

function parseRange(values: string): { min: number; max: number } | null {
  try {
    const v = JSON.parse(values) as { min?: number; max?: number };
    if (typeof v.min === "number" && typeof v.max === "number") {
      return { min: v.min, max: v.max };
    }
  } catch {
    // ignore
  }
  return null;
}

// ---------------------------------------------------------------------------
// DB I/O
// ---------------------------------------------------------------------------

export async function loadCredentials(): Promise<{
  credentials: TuyaCredentials | null;
  enabled: boolean;
}> {
  const row = await prisma.tuyaConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  if (!row.accessId || !row.accessSecret) {
    return { credentials: null, enabled: row.enabled };
  }
  const region = (["us", "eu", "cn", "in"].includes(row.region) ? row.region : "us") as TuyaRegion;
  return {
    credentials: {
      accessId: row.accessId,
      accessSecret: row.accessSecret,
      region,
    },
    enabled: row.enabled,
  };
}

export async function saveCredentials(
  credentials: TuyaCredentials & { enabled?: boolean },
  updatedBy: string = "",
): Promise<void> {
  await prisma.tuyaConfig.upsert({
    where: { id: 1 },
    update: {
      accessId: credentials.accessId.trim(),
      accessSecret: credentials.accessSecret.trim(),
      region: credentials.region,
      ...(typeof credentials.enabled === "boolean" ? { enabled: credentials.enabled } : {}),
      updatedBy: updatedBy.slice(0, 64),
    },
    create: {
      id: 1,
      accessId: credentials.accessId.trim(),
      accessSecret: credentials.accessSecret.trim(),
      region: credentials.region,
      enabled: credentials.enabled ?? true,
      updatedBy: updatedBy.slice(0, 64),
    },
  });
  // Invalidate the in-memory token so the next call uses the fresh creds.
  clearTuyaTokenCache();
}

export async function loadCachedDevices(): Promise<TuyaDeviceCached[]> {
  const rows = await prisma.tuyaDevice.findMany({
    orderBy: { name: "asc" },
  });
  return rows.map((r) => {
    let caps: TuyaCapability[] = [];
    try {
      caps = JSON.parse(r.capabilities);
      if (!Array.isArray(caps)) caps = [];
    } catch {
      caps = [];
    }
    return {
      id: r.id,
      name: r.name,
      category: r.category,
      productName: r.productName,
      online: r.online,
      capabilities: caps,
      switchCode: r.switchCode,
      supportsBrightness: r.supportsBrightness,
      supportsColor: r.supportsColor,
      supportsTempK: r.supportsTempK,
    };
  });
}

// Pull fresh device list from Tuya Cloud and replace the cache. Returns the
// new device list (already cached). Throws on connection / auth errors.
export async function syncDevices(): Promise<TuyaDeviceCached[]> {
  const { credentials } = await loadCredentials();
  if (!credentials) throw new Error("Tuya credentials not configured");

  const list = await listAllDevices(credentials);
  const enriched: TuyaDeviceCached[] = [];

  for (const dev of list) {
    let caps: TuyaCapability[] = [];
    try {
      caps = await getDeviceSpec(credentials, dev.id);
    } catch (err) {
      console.warn(`[tuya] spec fetch failed for ${dev.id}:`, err);
    }
    const switchCode = detectCode(caps, SWITCH_CODES);
    enriched.push({
      id: dev.id,
      name: dev.name,
      category: dev.category,
      productName: dev.product_name,
      online: dev.online,
      capabilities: caps,
      switchCode,
      supportsBrightness: hasCapability(caps, BRIGHTNESS_CODES),
      supportsColor: hasCapability(caps, COLOR_CODES),
      supportsTempK: hasCapability(caps, TEMP_K_CODES),
    });
  }

  // Replace cache atomically: delete absent devices, upsert present ones.
  const presentIds = new Set(enriched.map((d) => d.id));
  await prisma.$transaction(async (tx) => {
    const existing = await tx.tuyaDevice.findMany({ select: { id: true } });
    const toDelete = existing.map((r) => r.id).filter((id) => !presentIds.has(id));
    if (toDelete.length > 0) {
      await tx.tuyaDevice.deleteMany({ where: { id: { in: toDelete } } });
    }
    for (const d of enriched) {
      await tx.tuyaDevice.upsert({
        where: { id: d.id },
        create: {
          id: d.id,
          name: d.name,
          category: d.category,
          productName: d.productName,
          online: d.online,
          capabilities: JSON.stringify(d.capabilities),
          switchCode: d.switchCode,
          supportsBrightness: d.supportsBrightness,
          supportsColor: d.supportsColor,
          supportsTempK: d.supportsTempK,
        },
        update: {
          name: d.name,
          category: d.category,
          productName: d.productName,
          online: d.online,
          capabilities: JSON.stringify(d.capabilities),
          switchCode: d.switchCode,
          supportsBrightness: d.supportsBrightness,
          supportsColor: d.supportsColor,
          supportsTempK: d.supportsTempK,
          lastSyncedAt: new Date(),
        },
      });
    }
  });

  return enriched;
}

// Re-export so admin endpoints don't need to know about the inner client.
export { testTuyaConnection };

// ---------------------------------------------------------------------------
// Device lookup — partial / case-insensitive name match (mirrors Shila)
// ---------------------------------------------------------------------------

function findDevice(
  devices: TuyaDeviceCached[],
  target: string,
): TuyaDeviceCached | null {
  const t = target.trim().toLowerCase();
  if (!t) return null;
  // Exact id
  const byId = devices.find((d) => d.id === target);
  if (byId) return byId;
  // Exact name (ci)
  const byName = devices.find((d) => d.name.toLowerCase() === t);
  if (byName) return byName;
  // Substring
  const byPartial = devices.find((d) => d.name.toLowerCase().includes(t));
  if (byPartial) return byPartial;
  return null;
}

// Group resolver — returns multiple devices when target is a "group keyword"
// like "all lights" / "semua lampu" / just "lampu" alone.
function resolveTargets(devices: TuyaDeviceCached[], target: string): TuyaDeviceCached[] {
  const t = target.trim().toLowerCase();
  const allKeywords = ["semua", "all", "seluruh", "everything"];
  const lightKeywords = ["lampu", "light", "lights"];
  const isAll = allKeywords.some((k) => t.includes(k));
  const isLight = lightKeywords.some((k) => t === k || t.includes(k));

  if (isAll && isLight) {
    return devices.filter((d) => d.category === "dj" || d.supportsColor || d.supportsBrightness);
  }
  if (isAll) {
    return devices;
  }
  if (isLight && (t === "lampu" || t === "lights" || t === "light")) {
    return devices.filter((d) => d.category === "dj" || d.supportsColor || d.supportsBrightness);
  }
  const single = findDevice(devices, target);
  return single ? [single] : [];
}

// ---------------------------------------------------------------------------
// High-level commands
// ---------------------------------------------------------------------------

export interface ControlArgs {
  target: string;
  action: string;          // "on" | "off" | "set"
  brightness?: number;     // 0-100
  color?: string;          // name from colorMap
  temperature?: number;    // 0-100 (warm→cool, mapped to device range)
}

export async function executeControl(args: ControlArgs): Promise<TuyaCommandResult> {
  const { credentials, enabled } = await loadCredentials();
  if (!credentials) {
    return { success: false, error: "Tuya not configured. Ask admin to set credentials." };
  }
  if (!enabled) {
    return { success: false, error: "Tuya integration is disabled in admin settings." };
  }

  const cached = await loadCachedDevices();
  const targets = resolveTargets(cached, args.target);
  if (targets.length === 0) {
    return {
      success: false,
      error: `No device matches "${args.target}". Available: ${cached.map((d) => d.name).join(", ")}`,
    };
  }

  const action = args.action.trim().toLowerCase();
  const turnOnAliases = ["on", "turn_on", "nyalakan", "hidupin", "buka"];
  const turnOffAliases = ["off", "turn_off", "matikan", "tutup"];

  const results: { device: string; ok: boolean; msg?: string }[] = [];

  for (const dev of targets) {
    const commands: Array<{ code: string; value: unknown }> = [];

    // Compose commands based on flags. Order matters — set work_mode before
    // colour_data so the device interprets the colour value correctly.
    let needsColorMode = false;
    let needsWhiteMode = false;
    if (args.color) {
      if (isWhiteMode(args.color)) {
        needsWhiteMode = true;
      } else {
        const hsv = resolveColor(args.color);
        if (hsv && dev.supportsColor) {
          needsColorMode = true;
          const colorCode = detectCode(dev.capabilities, COLOR_CODES);
          if (colorCode) {
            commands.push({ code: colorCode, value: hsv });
          }
        }
      }
    }
    const modeCode = detectCode(dev.capabilities, MODE_CODES);
    if (needsColorMode && modeCode) {
      commands.unshift({ code: modeCode, value: "colour" });
    }
    if (needsWhiteMode && modeCode) {
      commands.push({ code: modeCode, value: "white" });
    }

    if (typeof args.brightness === "number" && dev.supportsBrightness) {
      const bcode = detectCode(dev.capabilities, BRIGHTNESS_CODES);
      if (bcode) {
        const range =
          parseRange(dev.capabilities.find((c) => c.code === bcode)?.values ?? "{}") ?? { min: 10, max: 1000 };
        const pct = Math.max(0, Math.min(100, args.brightness));
        const scaled = Math.round(range.min + (pct / 100) * (range.max - range.min));
        commands.push({ code: bcode, value: scaled });
      }
    }

    if (typeof args.temperature === "number" && dev.supportsTempK) {
      const tcode = detectCode(dev.capabilities, TEMP_K_CODES);
      if (tcode) {
        const range =
          parseRange(dev.capabilities.find((c) => c.code === tcode)?.values ?? "{}") ?? { min: 0, max: 1000 };
        const pct = Math.max(0, Math.min(100, args.temperature));
        const scaled = Math.round(range.min + (pct / 100) * (range.max - range.min));
        commands.push({ code: tcode, value: scaled });
      }
    }

    // On/off — push last so "set color + turn on" works in one call.
    if (turnOnAliases.includes(action) && dev.switchCode) {
      commands.push({ code: dev.switchCode, value: true });
    } else if (turnOffAliases.includes(action) && dev.switchCode) {
      commands.push({ code: dev.switchCode, value: false });
    }

    // If `action === "set"` and color/brightness present, no on/off needed.
    if (commands.length === 0) {
      results.push({ device: dev.name, ok: false, msg: "No applicable commands for this device" });
      continue;
    }

    try {
      const r = await sendDeviceCommands(credentials, dev.id, commands);
      results.push({ device: dev.name, ok: r.success, msg: r.message });
    } catch (err) {
      results.push({ device: dev.name, ok: false, msg: err instanceof Error ? err.message : String(err) });
    }
  }

  const allOk = results.every((r) => r.ok);
  return {
    success: allOk,
    device: results.map((r) => r.device).join(", "),
    action: args.action,
    message: allOk
      ? `Applied to ${results.length} device(s)`
      : results.filter((r) => !r.ok).map((r) => `${r.device}: ${r.msg}`).join("; "),
  };
}

// Read current device states. AI calls this when user asks "are the lights
// on?" / "what color is the lamp?".
export async function executeQuery(args: { target?: string }): Promise<{
  success: boolean;
  devices: Array<{
    name: string;
    online: boolean;
    state: { on?: boolean; brightnessPct?: number; colorMode?: string };
  }>;
  message?: string;
}> {
  const { credentials, enabled } = await loadCredentials();
  if (!credentials || !enabled) {
    return { success: false, devices: [], message: "Tuya not enabled" };
  }
  const cached = await loadCachedDevices();
  const targets = args.target ? resolveTargets(cached, args.target) : cached;
  const reports: Array<{
    name: string;
    online: boolean;
    state: { on?: boolean; brightnessPct?: number; colorMode?: string };
  }> = [];
  for (const dev of targets) {
    try {
      const status = await getDeviceStatus(credentials, dev.id);
      const map = new Map<string, unknown>();
      for (const s of status) map.set(s.code, s.value);
      const state: { on?: boolean; brightnessPct?: number; colorMode?: string } = {};
      if (dev.switchCode && map.has(dev.switchCode)) {
        state.on = Boolean(map.get(dev.switchCode));
      }
      const bcode = detectCode(dev.capabilities, BRIGHTNESS_CODES);
      if (bcode && map.has(bcode)) {
        const v = Number(map.get(bcode));
        const range = parseRange(
          dev.capabilities.find((c) => c.code === bcode)?.values ?? "{}",
        ) ?? { min: 10, max: 1000 };
        if (Number.isFinite(v) && range.max > range.min) {
          state.brightnessPct = Math.round(((v - range.min) / (range.max - range.min)) * 100);
        }
      }
      const mcode = detectCode(dev.capabilities, MODE_CODES);
      if (mcode && map.has(mcode)) {
        state.colorMode = String(map.get(mcode));
      }
      reports.push({ name: dev.name, online: dev.online, state });
    } catch {
      reports.push({ name: dev.name, online: false, state: {} });
    }
  }
  return { success: true, devices: reports };
}

// Compact list for the AI's tool list — just the names, plus a short
// capability hint. Used when injecting context into the system prompt.
export async function listDeviceNamesForAi(): Promise<string[]> {
  const cached = await loadCachedDevices();
  return cached.map((d) => {
    const caps: string[] = [];
    if (d.switchCode) caps.push("on/off");
    if (d.supportsBrightness) caps.push("brightness");
    if (d.supportsColor) caps.push("color");
    if (d.supportsTempK) caps.push("temp");
    return `${d.name}${caps.length ? ` (${caps.join(", ")})` : ""}`;
  });
}
