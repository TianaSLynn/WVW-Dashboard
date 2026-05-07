import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year  = parseInt(searchParams.get("year")  ?? String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));

  const start = new Date(year, month - 1, 1).toISOString();
  const end   = new Date(year, month, 1).toISOString();

  const { data } = await supabase
    .from("post_log")
    .select("*")
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: true });

  const entries = (data ?? []).map((row) => ({
    id: row.id as string,
    date: (row.created_at as string).slice(0, 10),
    platform: row.platform as string,
    theme: row.theme as string,
    status: row.status as string,
    excerpt: (row.excerpt ?? "") as string,
  }));

  return Response.json({ year, month, entries });
}
