import { getPreferenceHeatmap } from "@/lib/analytics";

export async function GET() {
  const data = await getPreferenceHeatmap();
  return Response.json(data);
}
