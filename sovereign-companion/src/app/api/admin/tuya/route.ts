import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  loadCachedDevices,
  loadCredentials,
  saveCredentials,
  syncDevices,
  testTuyaConnection,
} from "@/lib/tuya/manager";
import type { TuyaRegion } from "@/lib/tuya/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET — return current credential metadata + cached device list. Secret is
// REDACTED in the response (we only echo the last 4 chars) so a leaked
// snapshot of admin state can't be replayed against Tuya.
export async function GET(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  try {
    const { credentials, enabled } = await loadCredentials();
    const devices = await loadCachedDevices();
    const masked = credentials
      ? {
          accessId: credentials.accessId,
          accessSecretMasked: credentials.accessSecret
            ? `••••••••${credentials.accessSecret.slice(-4)}`
            : "",
          region: credentials.region,
        }
      : null;
    return Response.json({
      ok: true,
      enabled,
      credentials: masked,
      hasSecret: Boolean(credentials?.accessSecret),
      devices,
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// POST — save / update credentials. Body shape:
//   { action: "save", credentials: { accessId, accessSecret, region }, enabled? }
//   { action: "test" }                     — try a token mint with current creds
//   { action: "sync" }                     — re-fetch the device list from cloud
//   { action: "toggle", enabled: boolean } — flip the master switch
export async function POST(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const action = String(body.action ?? "");

  try {
    if (action === "save") {
      const c = (body.credentials ?? {}) as Record<string, unknown>;
      const accessId = typeof c.accessId === "string" ? c.accessId.trim() : "";
      // Preserve the existing secret when admin submits the masked placeholder
      // value (i.e. they didn't change the secret).
      let accessSecret = typeof c.accessSecret === "string" ? c.accessSecret : "";
      if (!accessSecret || accessSecret.startsWith("••••")) {
        const existing = await loadCredentials();
        accessSecret = existing.credentials?.accessSecret ?? "";
      }
      const region = ((["us", "eu", "cn", "in"] as const).includes(c.region as TuyaRegion)
        ? (c.region as TuyaRegion)
        : "us");
      const enabled = typeof body.enabled === "boolean" ? body.enabled : true;
      if (!accessId || !accessSecret) {
        return Response.json({ ok: false, error: "accessId + accessSecret required" }, { status: 400 });
      }
      await saveCredentials({ accessId, accessSecret, region, enabled });
      return Response.json({ ok: true });
    }

    if (action === "test") {
      const { credentials } = await loadCredentials();
      if (!credentials) return Response.json({ ok: false, error: "credentials_missing" }, { status: 400 });
      const result = await testTuyaConnection(credentials);
      return Response.json({ ok: result.ok, message: result.message, uid: result.uid });
    }

    if (action === "sync") {
      const devices = await syncDevices();
      return Response.json({ ok: true, count: devices.length, devices });
    }

    if (action === "toggle") {
      const enabled = body.enabled === true;
      const { credentials } = await loadCredentials();
      if (!credentials) {
        return Response.json({ ok: false, error: "credentials_missing" }, { status: 400 });
      }
      await saveCredentials({ ...credentials, enabled });
      return Response.json({ ok: true, enabled });
    }

    return Response.json({ ok: false, error: `unknown_action: ${action}` }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
