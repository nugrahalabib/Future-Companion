import { loadSuggestions } from "@/lib/suggestionTemplate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Public endpoint — encounter page reads this on mount to render the right-
// side suggestion panel. No auth required (data isn't sensitive) and never
// cached so admin edits land on the very next encounter session.
export async function GET() {
  try {
    const template = await loadSuggestions();
    return Response.json(
      { template },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[suggestions GET] failed:", message);
    return Response.json({ error: "load_failed", message }, { status: 500 });
  }
}
