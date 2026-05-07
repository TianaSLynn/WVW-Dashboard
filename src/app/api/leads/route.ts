import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? [], {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    platform: string;
    interaction_type: string;
    user_name: string;
    message_summary: string;
    lead_flag?: boolean;
    follow_up_needed?: boolean;
    follow_up_status?: string;
    related_content?: string;
    notes?: string;
    date?: string;
  };

  if (!body.platform || !body.interaction_type || !body.user_name || !body.message_summary) {
    return Response.json({ error: "platform, interaction_type, user_name, message_summary required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      platform:          body.platform,
      interaction_type:  body.interaction_type,
      user_name:         body.user_name,
      message_summary:   body.message_summary,
      lead_flag:         body.lead_flag ?? false,
      follow_up_needed:  body.follow_up_needed ?? false,
      follow_up_status:  body.follow_up_status ?? "New",
      related_content:   body.related_content ?? "",
      notes:             body.notes ?? "",
      date:              body.date ?? new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json() as { id: string };
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ deleted: id });
}
