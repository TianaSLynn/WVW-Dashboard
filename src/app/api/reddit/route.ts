import { fetchSignals } from "@/lib/signals";

export const revalidate = 3600;

export async function GET() {
  const { signals, source } = await fetchSignals();
  return Response.json({ signals, fetchedAt: new Date().toISOString(), source });
}
