import { supabase } from "./supabase";

export interface PostLogEntry {
  id: string;
  timestamp: string;
  platform: string;
  theme: string;
  excerpt: string;
  status: "posted" | "queued" | "error" | "skipped";
}

export async function appendPostLog(entry: {
  platform: string;
  theme: string;
  text: string;
  status: PostLogEntry["status"];
}): Promise<void> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await supabase.from("post_log").insert({
    id,
    platform: entry.platform,
    theme: entry.theme,
    excerpt: entry.text.slice(0, 120),
    status: entry.status,
  });
}

export async function readPostLog(): Promise<PostLogEntry[]> {
  const { data } = await supabase
    .from("post_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    timestamp: row.created_at as string,
    platform: row.platform as string,
    theme: row.theme as string,
    excerpt: (row.excerpt ?? "") as string,
    status: row.status as PostLogEntry["status"],
  }));
}
