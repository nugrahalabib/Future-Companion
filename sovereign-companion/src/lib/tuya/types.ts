// Type definitions for the Tuya Cloud integration. Mirrors the shape of
// the official Tuya Cloud REST API plus a few normalized helpers used by
// the runtime tool dispatcher (lib/tuya/manager.ts).

export type TuyaRegion = "us" | "eu" | "cn" | "in";

export interface TuyaCredentials {
  accessId: string;
  accessSecret: string;
  region: TuyaRegion;
}

export interface TuyaTokenResponse {
  result: {
    access_token: string;
    refresh_token: string;
    expire_time: number;        // seconds
    uid: string;
  };
  success: boolean;
  t: number;
  msg?: string;
}

// Capability descriptor pulled from /v1.0/iot-03/devices/{id}/specifications.
// `mode` is "ro" for read-only status fields and "rw" for read-write
// functions — admins typically only invoke "rw" codes.
export interface TuyaCapability {
  code: string;
  type: string;          // "Boolean", "Integer", "Enum", "Json", "String"
  values: string;        // JSON-encoded constraint string per Tuya spec
  mode: "ro" | "rw";
}

export interface TuyaDeviceListItem {
  id: string;            // device id
  name: string;
  category: string;      // tuya category code, e.g. "dj" (light), "kg" (switch)
  product_name: string;
  online: boolean;
}

export interface TuyaDeviceCached {
  id: string;
  name: string;
  category: string;
  productName: string;
  online: boolean;
  capabilities: TuyaCapability[];
  switchCode: string | null;     // detected on/off control code
  supportsBrightness: boolean;
  supportsColor: boolean;
  supportsTempK: boolean;
  // Allowlist flag — true when admin has whitelisted this device for the AI
  // runtime (system-prompt injection + companion tools). Admin UI exposes
  // every cached device regardless; only this flag gates AI access.
  allowed: boolean;
}

export interface TuyaCommandResult {
  success: boolean;
  device?: string;
  action?: string;
  message?: string;
  error?: string;
}

// Generic Tuya REST envelope.
export interface TuyaApiEnvelope<T = unknown> {
  success: boolean;
  result?: T;
  msg?: string;
  code?: number;
  t: number;
}
