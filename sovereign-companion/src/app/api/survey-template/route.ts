import { loadTemplate } from "@/lib/surveyTemplate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Public endpoint — used by /questionnaire to render the active form.
// No auth required; the schema itself is not sensitive.
export async function GET() {
  try {
    const template = await loadTemplate();
    return Response.json(
      { template },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[survey-template GET] failed:", message);
    return Response.json({ error: "load_failed", message }, { status: 500 });
  }
}
