import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("content_queue")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? [], { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    platform: string;
    theme: string;
    text: string;
    status?: string;
  };

  if (!body.platform || !body.theme || !body.text) {
    return Response.json({ error: "platform, theme, text required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("content_queue")
    .insert({ platform: body.platform, theme: body.theme, text: body.text, status: body.status ?? "draft" })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json() as { id: string };
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const { error } = await supabase.from("content_queue").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ deleted: id });
}
