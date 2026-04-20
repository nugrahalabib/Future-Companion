import { getPreferenceHeatmap } from "@/lib/analytics";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const data = await getPreferenceHeatmap();
  return Response.json(data);
}
