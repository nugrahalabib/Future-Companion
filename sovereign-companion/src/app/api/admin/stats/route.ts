import { getKPIs, getConversionFunnel } from "@/lib/analytics";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  const deny = requireAdmin(req);
  if (deny) return deny;
  const [kpis, funnel] = await Promise.all([getKPIs(), getConversionFunnel()]);
  return Response.json({ kpis, funnel });
}
