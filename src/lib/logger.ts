import { supabase } from "./supabase";

export interface PostLogEntry {
  id: string;
  timestamp: string;
  platform: string;
  theme: string;
  excerpt: string;
  status: "posted" | "queued" | "error" | "skipped";
  error_detail?: string;
  likes: number;
  reposts: number;
  replies: number;
  quotes: number;
  stats_updated_at?: string;
}

export async function appendPostLog(entry: {
  platform: string;
  theme: string;
  text: string;
  status: PostLogEntry["status"];
  error_detail?: string;
  post_uri?: string;
  post_cid?: string;
}): Promise<void> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await supabase.from("post_log").insert({
    id,
    platform: entry.platform,
    theme: entry.theme,
    excerpt: entry.text.slice(0, 400),
    status: entry.status,
    error_detail: entry.error_detail ?? null,
    post_uri: entry.post_uri ?? null,
    post_cid: entry.post_cid ?? null,
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
    error_detail: (row.error_detail ?? undefined) as string | undefined,
    likes: (row.likes ?? 0) as number,
    reposts: (row.reposts ?? 0) as number,
    replies: (row.replies ?? 0) as number,
    quotes: (row.quotes ?? 0) as number,
    stats_updated_at: (row.stats_updated_at ?? undefined) as string | undefined,
  }));
}
