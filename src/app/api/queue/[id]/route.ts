import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { postToPlatform } from "@/lib/post-dispatcher";
import { appendPostLog } from "@/lib/logger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json() as { action: "approve" | "reject"; text?: string };

  if (body.action === "reject") {
    const { error } = await supabase
      .from("content_queue")
      .update({ status: "rejected" })
      .eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ status: "rejected" });
  }

  if (body.action === "approve") {
    // Fetch the queue item
    const { data: item, error: fetchErr } = await supabase
      .from("content_queue")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !item) return Response.json({ error: "Item not found" }, { status: 404 });

    const text = body.text ?? (item as { text: string }).text;
    const platform = (item as { platform: string }).platform;
    const theme = (item as { theme: string }).theme;

    try {
      await postToPlatform(platform, text);

      await supabase
        .from("content_queue")
        .update({ status: "posted", text, posted_at: new Date().toISOString() })
        .eq("id", id);

      void appendPostLog({ platform, theme, text, status: "posted" });

      return Response.json({ status: "posted", platform, theme });
    } catch (err) {
      await supabase.from("content_queue").update({ status: "error" }).eq("id", id);
      return Response.json({ error: String(err) }, { status: 500 });
    }
  }

  return Response.json({ error: "action must be approve or reject" }, { status: 400 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { text } = await req.json() as { text: string };
  if (!text) return Response.json({ error: "text required" }, { status: 400 });

  const { error } = await supabase
    .from("content_queue")
    .update({ text })
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ updated: id });
}
