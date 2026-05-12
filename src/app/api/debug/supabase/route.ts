// Diagnostic endpoint — shows Supabase connection health and env var presence.
// Does NOT expose values — only shows prefix chars and whether reads succeed.
// Visit /api/debug/supabase in production to diagnose empty post_log reads.
export async function GET() {
  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_ANON_KEY ?? "";

  const envCheck = {
    SUPABASE_URL_set: url.length > 0,
    SUPABASE_URL_prefix: url.slice(0, 20) || "(not set)",
    SUPABASE_ANON_KEY_set: key.length > 0,
    SUPABASE_ANON_KEY_prefix: key.slice(0, 8) || "(not set)",
    ANTHROPIC_API_KEY_set: !!(process.env.ANTHROPIC_API_KEY),
    CRON_SECRET_set: !!(process.env.CRON_SECRET),
  };

  // Attempt a live read from post_log using the same client the app uses
  let queryResult: { count: number | null; error: string | null; sample: unknown[] } = {
    count: null,
    error: null,
    sample: [],
  };

  try {
    const { createClient } = await import("@supabase/supabase-js");
    if (url && url !== "https://placeholder.supabase.co" && key && key !== "placeholder") {
      const client = createClient(url, key);
      const { data, error, count } = await client
        .from("post_log")
        .select("id, platform, status, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(3);
      queryResult = {
        count: count ?? (data?.length ?? 0),
        error: error ? error.message : null,
        sample: data ?? [],
      };
    } else {
      queryResult.error = "Supabase URL or key is the placeholder fallback — env vars not set in Vercel.";
    }
  } catch (err) {
    queryResult.error = String(err);
  }

  return Response.json(
    { envCheck, queryResult, timestamp: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
