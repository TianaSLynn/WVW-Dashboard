import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("conversions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? [], { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    source_platform: string;
    conversion_type: string;
    description: string;
    value_usd?: number;
    status?: string;
    notes?: string;
    date?: string;
  };

  if (!body.source_platform || !body.conversion_type || !body.description) {
    return Response.json({ error: "source_platform, conversion_type, description required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("conversions")
    .insert({
      source_platform: body.source_platform,
      conversion_type: body.conversion_type,
      description:     body.description,
      value_usd:       body.value_usd ?? 0,
      status:          body.status ?? "New",
      notes:           body.notes ?? "",
      date:            body.date ?? new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json() as { id: string; status: string };
  if (!id || !status) return Response.json({ error: "id and status required" }, { status: 400 });
  const { error } = await supabase.from("conversions").update({ status }).eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ updated: id });
}
