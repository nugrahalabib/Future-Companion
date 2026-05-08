import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  DEFAULT_SUGGESTIONS,
  KNOWN_HOBBIES,
  loadSuggestions,
  saveSuggestions,
  validateTemplate,
} from "@/lib/suggestionTemplate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Admin CRUD for the singleton SuggestionTemplate.
// GET ?reset=1 → returns DEFAULT_SUGGESTIONS preview without writing.
// Response always includes `knownHobbies` so the builder UI can offer the
// canonical list when adding a new hobby-prompt group.

export async function GET(req: NextRequest) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const url = new URL(req.url);
  if (url.searchParams.get("reset") === "1") {
    return Response.json({
      template: DEFAULT_SUGGESTIONS,
      knownHobbies: KNOWN_HOBBIES,
    });
  }
  try {
    const template = await loadSuggestions();
    return Response.json({ template, knownHobbies: KNOWN_HOBBIES });
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
    const validated = validateTemplate(obj.template);
    const updatedBy = typeof obj.updatedBy === "string" ? obj.updatedBy : "";
    const saved = await saveSuggestions(validated, updatedBy);
    return Response.json({ template: saved });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: "validation_failed", message }, { status: 400 });
  }
}
