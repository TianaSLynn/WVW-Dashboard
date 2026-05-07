"use client";
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowUpDown, Search, TrendingUp } from "lucide-react";
import type { ContentPost, Platform, ContentType, TopicCategory } from "@/types/dashboard";
import { calcEngagementRate, contentHealthScore } from "@/utils/calculations";

const C = { forest:"#1C3A2A", bone:"#F5F0E8", rose:"#C4A09A", gold:"#B8A06A", charcoal:"#3D3935", sage:"#4A5E4F", ivory:"#F9F5ED", warmBlack:"#1A1714" };

type SortKey = "engagementRate" | "reach" | "saves" | "shares" | "comments" | "datePosted";

interface Props { posts: ContentPost[] }

const STATUS_COLORS: Record<string, string> = {
  Posted: "#1C3A2A", Idea: "#B8A06A", Drafting: "#708090", Scheduled: "#0A66C2", Repurpose: "#A0522D", Archived: "#9CA3AF",
};

export default function ContentPerformanceTable({ posts }: Props) {
  const [search, setSearch]         = useState("");
  const [platform, setPlatform]     = useState<Platform | "All">("All");
  const [type, setType]             = useState<ContentType | "All">("All");
  const [topic, setTopic]           = useState<TopicCategory | "All">("All");
  const [convOnly, setConvOnly]     = useState(false);
  const [sortKey, setSortKey]       = useState<SortKey>("datePosted");
  const [sortDir, setSortDir]       = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded]     = useState<string | null>(null);

  const platforms  = useMemo(() => ["All", ...Array.from(new Set(posts.map((p) => p.platform)))], [posts]);
  const types      = useMemo(() => ["All", ...Array.from(new Set(posts.map((p) => p.contentType)))], [posts]);
  const topics     = useMemo(() => ["All", ...Array.from(new Set(posts.map((p) => p.topicCategory)))], [posts]);

  const filtered = useMemo(() => {
    let r = posts;
    if (platform !== "All")   r = r.filter((p) => p.platform === platform);
    if (type !== "All")       r = r.filter((p) => p.contentType === type);
    if (topic !== "All")      r = r.filter((p) => p.topicCategory === topic);
    if (convOnly)             r = r.filter((p) => p.conversionFlag);
    if (search.trim())        r = r.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.topicCategory.toLowerCase().includes(search.toLowerCase()));
    return [...r].sort((a, b) => {
      const av = sortKey === "datePosted" ? new Date(a.datePosted).getTime() : (a[sortKey] as number);
      const bv = sortKey === "datePosted" ? new Date(b.datePosted).getTime() : (b[sortKey] as number);
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [posts, platform, type, topic, convOnly, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const Th = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      className="py-3 px-3 text-left text-xs font-medium cursor-pointer select-none whitespace-nowrap hover:opacity-70"
      style={{ color: C.charcoal }}
      onClick={() => toggleSort(k)}
    >
      <span className="flex items-center gap-1">{label} <ArrowUpDown className="w-3 h-3" /></span>
    </th>
  );

  return (
    <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
      <CardHeader>
        <CardTitle className="font-serif text-xl">Content Performance Engine</CardTitle>
        <CardDescription style={{ color: C.charcoal }}>Full post-level analytics across all platforms. Filter, sort, and surface what's actually working.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: C.charcoal }} />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts…" className="pl-8 h-8 text-xs rounded-xl w-48" style={{ background: C.ivory, borderColor: "#DDD7CD" }} />
          </div>
          {[
            { label: "Platform", value: platform, set: setPlatform as (v: string) => void, opts: platforms },
            { label: "Type",     value: type,     set: setType     as (v: string) => void, opts: types },
            { label: "Topic",    value: topic,    set: setTopic    as (v: string) => void, opts: topics },
          ].map(({ label, value, set, opts }) => (
            <select key={label} value={value} onChange={(e) => set(e.target.value)} className="h-8 text-xs rounded-xl px-2 border" style={{ background: C.ivory, borderColor: "#DDD7CD", color: C.warmBlack }}>
              {opts.map((o) => <option key={o}>{o}</option>)}
            </select>
          ))}
          <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: C.charcoal }}>
            <input type="checkbox" checked={convOnly} onChange={(e) => setConvOnly(e.target.checked)} className="rounded" />
            Conversions only
          </label>
          <span className="text-xs ml-auto" style={{ color: C.charcoal }}>{filtered.length} posts</span>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "#DDD7CD" }}>
          <table className="w-full text-sm min-w-[900px]">
            <thead style={{ background: C.ivory }}>
              <tr>
                <th className="py-3 px-3 text-left text-xs font-medium" style={{ color: C.charcoal }}>Post</th>
                <th className="py-3 px-3 text-left text-xs font-medium" style={{ color: C.charcoal }}>Platform</th>
                <th className="py-3 px-3 text-left text-xs font-medium" style={{ color: C.charcoal }}>Type</th>
                <Th label="Date"   k="datePosted" />
                <Th label="Reach"  k="reach" />
                <Th label="Saves"  k="saves" />
                <Th label="Shares" k="shares" />
                <Th label="Eng %" k="engagementRate" />
                <th className="py-3 px-3 text-left text-xs font-medium" style={{ color: C.charcoal }}>Health</th>
                <th className="py-3 px-3 text-left text-xs font-medium" style={{ color: C.charcoal }}>Conv</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => {
                const eng    = calcEngagementRate(post);
                const health = contentHealthScore(post);
                const isOpen = expanded === post.id;
                return (
                  <React.Fragment key={post.id}>
                    <tr
                      className="border-t cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ borderColor: "#DDD7CD" }}
                      onClick={() => setExpanded(isOpen ? null : post.id)}
                    >
                      <td className="py-3 px-3 font-medium text-xs max-w-[200px]">
                        <div className="truncate" style={{ color: C.warmBlack }}>{post.title}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: C.charcoal }}>{post.topicCategory}</div>
                      </td>
                      <td className="py-3 px-3 text-xs" style={{ color: C.charcoal }}>{post.platform.replace(" Personal","").replace(" WVW","")}</td>
                      <td className="py-3 px-3 text-xs" style={{ color: C.charcoal }}>{post.contentType}</td>
                      <td className="py-3 px-3 text-xs" style={{ color: C.charcoal }}>{new Date(post.datePosted).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td>
                      <td className="py-3 px-3 text-xs font-medium" style={{ color: C.warmBlack }}>{post.reach.toLocaleString()}</td>
                      <td className="py-3 px-3 text-xs" style={{ color: C.charcoal }}>{post.saves.toLocaleString()}</td>
                      <td className="py-3 px-3 text-xs" style={{ color: C.charcoal }}>{post.shares.toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: eng >= 12 ? C.forest+"22" : eng >= 8 ? C.gold+"33" : C.rose+"33", color: eng >= 12 ? C.forest : C.warmBlack }}>
                          {eng.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 w-24">
                        <div className="flex items-center gap-1.5">
                          <Progress value={health} className="h-1.5 flex-1" />
                          <span className="text-[10px]" style={{ color: C.charcoal }}>{health}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {post.conversionFlag && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: C.forest, color: C.bone }}>✓</span>}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr style={{ background: C.ivory }}>
                        <td colSpan={10} className="px-4 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-3">
                            {[
                              ["Impressions", post.impressions.toLocaleString()],
                              ["Likes", post.likes.toLocaleString()],
                              ["Comments", post.comments.toLocaleString()],
                              ["Hook", post.hookType],
                              ["Tone", post.tone],
                              ["CTA", post.ctaType],
                              post.watchTime ? ["Watch Time", `${post.watchTime}%`] : ["Views", post.views.toLocaleString()],
                              ["Status", post.status],
                            ].map(([label, val]) => (
                              <div key={label}>
                                <p className="font-medium mb-0.5" style={{ color: C.charcoal }}>{label}</p>
                                <p style={{ color: C.warmBlack }}>{val}</p>
                              </div>
                            ))}
                          </div>
                          {post.whyItWorked && (
                            <div className="p-3 rounded-xl" style={{ background: C.forest+"11", borderLeft: `3px solid ${C.forest}` }}>
                              <p className="text-xs font-medium mb-1" style={{ color: C.forest }}>Why It Worked</p>
                              <p className="text-xs" style={{ color: C.charcoal }}>{post.whyItWorked}</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="py-12 text-center text-sm" style={{ color: C.charcoal }}>No posts match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
