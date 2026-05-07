import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data } = await supabase
    .from("settings")
    .select("value, updated_at")
    .eq("key", "theme_of_month")
    .single();

  return Response.json({ theme: data?.value ?? null, updatedAt: data?.updated_at ?? null });
}

export async function POST(req: Request) {
  const { theme } = await req.json() as { theme: string };
  await supabase
    .from("settings")
    .upsert({ key: "theme_of_month", value: theme, updated_at: new Date().toISOString() });

  return Response.json({ ok: true, theme });
}
