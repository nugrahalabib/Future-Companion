import { getKPIs, getConversionFunnel } from "@/lib/analytics";

export async function GET() {
  const [kpis, funnel] = await Promise.all([getKPIs(), getConversionFunnel()]);
  return Response.json({ kpis, funnel });
}
