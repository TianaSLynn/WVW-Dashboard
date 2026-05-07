"use client";
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Users2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { CommunityInteraction, FollowUpStatus } from "@/types/dashboard";

const C = { forest:"#1C3A2A", bone:"#F5F0E8", rose:"#C4A09A", gold:"#B8A06A", charcoal:"#3D3935", sage:"#4A5E4F", ivory:"#F9F5ED", warmBlack:"#1A1714" };

const STATUS_COLORS: Record<FollowUpStatus, { bg: string; text: string }> = {
  "New":              { bg: C.gold+"33",       text: C.warmBlack },
  "Needs Response":   { bg: "#FEE2E2",         text: "#991B1B"   },
  "Responded":        { bg: C.sage+"33",       text: C.forest    },
  "Warm Lead":        { bg: C.gold+"55",       text: "#92400E"   },
  "Booked Call":      { bg: C.forest+"22",     text: C.forest    },
  "Closed":           { bg: "#D1FAE5",         text: "#065F46"   },
  "Not a Fit":        { bg: "#F3F4F6",         text: "#6B7280"   },
};

const STATUSES: FollowUpStatus[] = ["New","Needs Response","Responded","Warm Lead","Booked Call","Closed","Not a Fit"];

interface Props { interactions: CommunityInteraction[] }

export default function CommunityLeads({ interactions }: Props) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FollowUpStatus | "All">("All");
  const [leadsOnly, setLeadsOnly] = useState(false);

  const filtered = useMemo(() => {
    let r = interactions;
    if (filterStatus !== "All") r = r.filter((i) => i.followUpStatus === filterStatus);
    if (leadsOnly)              r = r.filter((i) => i.leadFlag);
    if (search.trim())          r = r.filter((i) => i.userName.toLowerCase().includes(search.toLowerCase()) || i.messageSummary.toLowerCase().includes(search.toLowerCase()));
    return r.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [interactions, filterStatus, leadsOnly, search]);

  const leadCount    = interactions.filter((i) => i.leadFlag).length;
  const needsResp    = interactions.filter((i) => i.followUpStatus === "Needs Response").length;
  const bookedCalls  = interactions.filter((i) => i.followUpStatus === "Booked Call").length;

  return (
    <div className="space-y-4">
      {/* ── KPI row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Leads",     value: leadCount,   color: C.forest },
          { label: "Needs Response",   value: needsResp,   color: "#A0522D" },
          { label: "Calls Booked",     value: bookedCalls, color: "#0A66C2" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="rounded-2xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-serif font-semibold" style={{ color }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: C.charcoal }}>{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Users2 className="w-4 h-4" style={{ color: C.forest }} />
            Community + Lead Tracker
          </CardTitle>
          <CardDescription style={{ color: C.charcoal }}>DMs, inquiries, collaborations, and high-signal interactions across platforms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: C.charcoal }} />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search interactions…" className="pl-8 h-8 text-xs rounded-xl w-48" style={{ background: C.ivory, borderColor: "#DDD7CD" }} />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as FollowUpStatus | "All")} className="h-8 text-xs rounded-xl px-2 border" style={{ background: C.ivory, borderColor: "#DDD7CD", color: C.warmBlack }}>
              <option value="All">All Statuses</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: C.charcoal }}>
              <input type="checkbox" checked={leadsOnly} onChange={(e) => setLeadsOnly(e.target.checked)} />
              Leads only
            </label>
            <span className="text-xs ml-auto" style={{ color: C.charcoal }}>{filtered.length} interactions</span>
          </div>

          <div className="space-y-2">
            {filtered.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl border" style={{ background: C.ivory, borderColor: item.leadFlag ? C.gold+"66" : "#DDD7CD" }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium" style={{ color: C.warmBlack }}>{item.userName}</span>
                      {item.leadFlag && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: C.gold, color: C.warmBlack }}>Lead</span>}
                      <span className="text-xs" style={{ color: C.charcoal }}>{item.interactionType}</span>
                      <span className="text-xs" style={{ color: C.charcoal }}>· {item.platform}</span>
                    </div>
                    <p className="text-xs" style={{ color: C.charcoal }}>{item.messageSummary}</p>
                    {item.notes && <p className="text-[11px] mt-1.5 italic" style={{ color: C.sage }}>{item.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap" style={{ background: STATUS_COLORS[item.followUpStatus]?.bg ?? C.bone, color: STATUS_COLORS[item.followUpStatus]?.text ?? C.charcoal }}>
                      {item.followUpStatus}
                    </span>
                    <span className="text-[10px]" style={{ color: C.charcoal }}>{new Date(item.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: C.charcoal }}>No interactions match your filters.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
