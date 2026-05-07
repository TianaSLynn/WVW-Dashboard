import { supabase } from "@/lib/supabase";

export const revalidate = 300;

export async function GET() {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, created_at, title, slug, meta_description, theme, source")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ posts: data ?? [] });
}
