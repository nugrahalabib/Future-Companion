import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  DEFAULT_TEMPLATE,
  loadTemplate,
  saveTemplate,
} from "@/lib/surveyTemplate";

// Force-dynamic guarantees fresh DB state after admin saves — Next.js
// production caching would otherwise serve stale templates.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Admin CRUD for the singleton SurveyTemplate.
// GET ?reset=1 → returns the DEFAULT_TEMPLATE without writing it (used by the
// builder UI's "Reset to Default" preview action).

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const url = new URL(req.url);
  if (url.searchParams.get("reset") === "1") {
    return Response.json({ template: DEFAULT_TEMPLATE });
  }
  try {
    const template = await loadTemplate();
    return Response.json({ template });
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
  const obj = (body ?? {}) as { template?: unknown; updatedBy?: string };
  if (!obj.template) {
    return Response.json({ error: "template_missing" }, { status: 400 });
  }
  try {
    const updatedBy = typeof obj.updatedBy === "string" ? obj.updatedBy : "";
    const saved = await saveTemplate(
      obj.template as Parameters<typeof saveTemplate>[0],
      updatedBy,
    );
    return Response.json({ template: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "validation_failed", message }, { status: 400 });
  }
}
