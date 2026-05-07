import { createClient } from "@supabase/supabase-js";

// Falls back to a placeholder so the module loads even if env vars are missing.
// Actual DB calls will fail gracefully (returning null data) rather than crashing the route.
const url = process.env.SUPABASE_URL ?? "https://placeholder.supabase.co";
const key = process.env.SUPABASE_ANON_KEY ?? "placeholder";

export const supabase = createClient(url, key);

export interface BlogPost {
  id: string;
  created_at: string;
  title: string;
  slug: string;
  meta_description: string | null;
  content_markdown: string;
  theme: string | null;
  published: boolean;
  source: string | null;
}

export interface PostLogEntry {
  id: string;
  created_at: string;
  platform: string;
  theme: string;
  excerpt: string | null;
  status: "posted" | "queued" | "error" | "skipped";
}
