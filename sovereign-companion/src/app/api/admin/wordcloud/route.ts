import { getWordCloudData } from "@/lib/analytics";

export async function GET() {
  const data = await getWordCloudData();
  return Response.json(data);
}
