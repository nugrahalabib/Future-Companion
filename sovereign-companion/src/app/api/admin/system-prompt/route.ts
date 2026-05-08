import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  DEFAULT_OVERRIDES,
  loadOverrides,
  saveOverrides,
  validateOverrides,
} from "@/lib/systemPromptOverrides";
import { BLOCK_DEFAULTS } from "@/lib/systemPromptDefaults";

// Force-dynamic + no-store guarantees admin always sees fresh DB state right
// after a save — critical for hot-reload semantics. Without this, Next.js may
// cache GET responses in production and serve stale overrides.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Admin CRUD for the singleton SystemPromptTemplate.
// GET ?reset=1 → returns DEFAULT_OVERRIDES preview without writing.
// Every GET response also includes `defaults` (BLOCK_DEFAULTS) so the
// admin editor can pre-fill textareas with the active fallback text.

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const url = new URL(req.url);
  if (url.searchParams.get("reset") === "1") {
    return Response.json({ overrides: DEFAULT_OVERRIDES, defaults: BLOCK_DEFAULTS });
  }
  try {
    const overrides = await loadOverrides();
    return Response.json({ overrides, defaults: BLOCK_DEFAULTS });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "load_failed", message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const obj = (body ?? {}) as { overrides?: unknown; updatedBy?: string };
  if (!obj.overrides) {
    return Response.json({ error: "overrides_missing" }, { status: 400 });
  }
  try {
    const validated = validateOverrides(obj.overrides);
    const updatedBy = typeof obj.updatedBy === "string" ? obj.updatedBy : "";
    const saved = await saveOverrides(validated, updatedBy);
    return Response.json({ overrides: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "validation_failed", message }, { status: 400 });
  }
}
