/**
 * Tuya Cloud REST client.
 *
 * Implements Tuya's HMAC-SHA256 signature scheme directly with Node's
 * `crypto` so we don't pull in a Python-shaped Tuya SDK. Two flavors of
 * signature exist:
 *
 *   1. Pre-token (token request itself): sign = client_id + t + nonce + str
 *   2. Authenticated (every other call): sign = client_id + access_token + t + nonce + str
 *
 * `str` is always:  HTTP_METHOD \n SHA256(body) \n signed_headers \n url
 *
 * Tokens are cached in-process for 90% of their TTL — the `expire_time`
 * Tuya returns is in seconds. Single-tenant booth deploy so a singleton
 * cache is fine; if we ever scale horizontally, swap to Redis.
 */

import crypto from "crypto";
import type {
  TuyaApiEnvelope,
  TuyaCapability,
  TuyaCredentials,
  TuyaDeviceListItem,
  TuyaRegion,
  TuyaTokenResponse,
} from "./types";

const REGION_ENDPOINTS: Record<TuyaRegion, string> = {
  us: "https://openapi.tuyaus.com",
  eu: "https://openapi.tuyaeu.com",
  cn: "https://openapi.tuyacn.com",
  in: "https://openapi.tuyain.com",
};

interface CachedToken {
  accessToken: string;
  uid: string;
  expiresAt: number; // epoch ms
}

// Module-level cache. Refreshes proactively before expiry.
let tokenCache: CachedToken | null = null;
let tokenCacheKey = ""; // accessId|region — busts when admin rotates creds

function endpointFor(region: TuyaRegion): string {
  return REGION_ENDPOINTS[region] ?? REGION_ENDPOINTS.us;
}

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

function hmacSha256Upper(message: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(message, "utf8")
    .digest("hex")
    .toUpperCase();
}

// `signedHeaders` is the comma-separated list of headers that participate in
// signing. For our calls we don't pass any custom signed headers, so this
// is always an empty string per spec.
function buildStringToSign(method: string, body: string, url: string): string {
  const bodyHash = sha256Hex(body);
  return `${method.toUpperCase()}\n${bodyHash}\n\n${url}`;
}

function nowMs(): number {
  return Date.now();
}

function nonce(): string {
  return crypto.randomUUID();
}

interface InternalRequestOptions {
  credentials: TuyaCredentials;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;            // e.g. "/v1.0/iot-01/associated-users/devices"
  body?: unknown;
  // When true, request a pre-auth signature (used for /v1.0/token only).
  preAuth?: boolean;
}

async function rawRequest<T>(
  opts: InternalRequestOptions,
  accessTokenOverride?: string,
): Promise<TuyaApiEnvelope<T>> {
  const { credentials, method, path, body } = opts;
  const url = `${endpointFor(credentials.region)}${path}`;
  const bodyStr = body ? JSON.stringify(body) : "";
  const t = nowMs().toString();
  const n = nonce();
  const stringToSign = buildStringToSign(method, bodyStr, path);

  // Different sign formula for token request vs authenticated calls.
  const signSource = opts.preAuth
    ? `${credentials.accessId}${t}${n}${stringToSign}`
    : `${credentials.accessId}${accessTokenOverride ?? ""}${t}${n}${stringToSign}`;

  const sign = hmacSha256Upper(signSource, credentials.accessSecret);

  const headers: Record<string, string> = {
    "client_id": credentials.accessId,
    "sign": sign,
    "sign_method": "HMAC-SHA256",
    "t": t,
    "nonce": n,
    "Content-Type": "application/json",
  };
  if (!opts.preAuth && accessTokenOverride) {
    headers["access_token"] = accessTokenOverride;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: bodyStr || undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Tuya HTTP ${res.status}: ${text}`);
  }

  const data = (await res.json()) as TuyaApiEnvelope<T>;
  return data;
}

// ---------------------------------------------------------------------------
// Token cache + auth-aware request wrapper
// ---------------------------------------------------------------------------

async function getToken(credentials: TuyaCredentials): Promise<{ accessToken: string; uid: string }> {
  const cacheKey = `${credentials.accessId}|${credentials.region}`;
  if (tokenCache && tokenCacheKey === cacheKey && tokenCache.expiresAt > nowMs() + 60_000) {
    return { accessToken: tokenCache.accessToken, uid: tokenCache.uid };
  }
  const env = await rawRequest<TuyaTokenResponse["result"]>(
    {
      credentials,
      method: "GET",
      path: "/v1.0/token?grant_type=1",
      preAuth: true,
    },
  );
  if (!env.success || !env.result) {
    throw new Error(`Tuya token mint failed: ${env.msg ?? "unknown"} (code ${env.code ?? "?"})`);
  }
  const token: CachedToken = {
    accessToken: env.result.access_token,
    uid: env.result.uid,
    // Refresh at 90% of TTL.
    expiresAt: nowMs() + env.result.expire_time * 1000 * 0.9,
  };
  tokenCache = token;
  tokenCacheKey = cacheKey;
  return { accessToken: token.accessToken, uid: token.uid };
}

// Force-clear cache. Called after admin rotates credentials.
export function clearTuyaTokenCache(): void {
  tokenCache = null;
  tokenCacheKey = "";
}

async function authedRequest<T>(
  credentials: TuyaCredentials,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<TuyaApiEnvelope<T>> {
  const { accessToken } = await getToken(credentials);
  return rawRequest<T>({ credentials, method, path, body }, accessToken);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// Test connection — returns true if the token mint succeeds.
export async function testTuyaConnection(credentials: TuyaCredentials): Promise<{
  ok: boolean;
  message: string;
  uid?: string;
}> {
  try {
    const { uid } = await getToken(credentials);
    return { ok: true, message: "Connected", uid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: msg };
  }
}

// Fetch all devices linked to the user the credentials represent.
// Tuya pages this — we follow the page tokens until exhausted.
export async function listAllDevices(credentials: TuyaCredentials): Promise<TuyaDeviceListItem[]> {
  const { uid } = await getToken(credentials);
  const collected: TuyaDeviceListItem[] = [];
  let lastRowKey: string | undefined;
  // Hard cap on iterations to avoid infinite loops if Tuya misbehaves.
  for (let page = 0; page < 50; page++) {
    const params = new URLSearchParams();
    params.set("page_size", "100");
    if (lastRowKey) params.set("last_row_key", lastRowKey);
    const path = `/v1.3/iot-03/devices?${params.toString()}&source_type=tuyaUser&source_id=${uid}`;
    const env = await authedRequest<{
      list: TuyaDeviceListItem[];
      has_more: boolean;
      last_row_key?: string;
    }>(credentials, "GET", path);
    if (!env.success || !env.result) {
      throw new Error(`Device list failed: ${env.msg ?? "unknown"}`);
    }
    collected.push(...(env.result.list ?? []));
    if (!env.result.has_more) break;
    lastRowKey = env.result.last_row_key;
    if (!lastRowKey) break;
  }
  return collected;
}

// Fetch the capability spec for a single device. Returns the merged
// status (read-only) + functions (read-write) list.
export async function getDeviceSpec(
  credentials: TuyaCredentials,
  deviceId: string,
): Promise<TuyaCapability[]> {
  const env = await authedRequest<{
    status?: Array<{ code: string; type: string; values: string }>;
    functions?: Array<{ code: string; type: string; values: string }>;
  }>(credentials, "GET", `/v1.0/devices/${deviceId}/specifications`);
  if (!env.success || !env.result) return [];
  const out = new Map<string, TuyaCapability>();
  for (const s of env.result.status ?? []) {
    out.set(s.code, { code: s.code, type: s.type, values: s.values, mode: "ro" });
  }
  for (const f of env.result.functions ?? []) {
    // Functions imply read-write; upgrade if status already had it.
    out.set(f.code, { code: f.code, type: f.type, values: f.values, mode: "rw" });
  }
  return Array.from(out.values());
}

// Fetch current status of a device (e.g. "is the light on?").
export async function getDeviceStatus(
  credentials: TuyaCredentials,
  deviceId: string,
): Promise<Array<{ code: string; value: unknown }>> {
  const env = await authedRequest<Array<{ code: string; value: unknown }>>(
    credentials,
    "GET",
    `/v1.0/iot-03/devices/${deviceId}/status`,
  );
  if (!env.success || !env.result) return [];
  return env.result;
}

// Send one or more commands to a device. The "commands" array allows
// batching multiple property changes in a single call (e.g. set work_mode
// to colour AND set colour_data_v2 in one round-trip).
export async function sendDeviceCommands(
  credentials: TuyaCredentials,
  deviceId: string,
  commands: Array<{ code: string; value: unknown }>,
): Promise<{ success: boolean; message?: string }> {
  if (commands.length === 0) return { success: true };
  const env = await authedRequest<boolean>(
    credentials,
    "POST",
    `/v1.0/iot-03/devices/${deviceId}/commands`,
    { commands },
  );
  if (env.success) return { success: true };
  return { success: false, message: env.msg ?? "Unknown error" };
}
