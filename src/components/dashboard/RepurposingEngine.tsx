"use client";
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RefreshCcw, Sparkles } from "lucide-react";
import type { ContentPost } from "@/types/dashboard";
import { generateRepurposeRecommendations } from "@/utils/recommendations";
import { repurposeScore } from "@/utils/calculations";

const C = { forest:"#1C3A2A", bone:"#F5F0E8", rose:"#C4A09A", gold:"#B8A06A", charcoal:"#3D3935", sage:"#4A5E4F", ivory:"#F9F5ED", warmBlack:"#1A1714" };

const ACTION_COLORS: Record<string, string> = {
  "Turn into newsletter":             C.forest,
  "Turn into carousel":               "#0A66C2",
  "Turn into podcast segment":        "#A0522D",
  "Turn into blog post":              C.sage,
  "Turn into short-form video":       "#E1306C",
  "Turn into LinkedIn thought piece": "#0A66C2",
  "Turn into training example":       C.gold,
  "Turn into client-facing case study": C.charcoal,
};

interface Props { posts: ContentPost[] }

export default function RepurposingEngine({ posts }: Props) {
  const [filter, setFilter] = useState<"All" | "High" | "Medium" | "Low">("All");
  const recs = useMemo(() => generateRepurposeRecommendations(posts), [posts]);
  const filtered = filter === "All" ? recs : recs.filter((r) => r.priority === filter);

  const topPosts = useMemo(() =>
    [...posts].sort((a, b) => repurposeScore(b) - repurposeScore(a)).slice(0, 5),
    [posts]
  );

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: C.gold }} />
            Highest Repurpose Potential
          </CardTitle>
          <CardDescription style={{ color: C.charcoal }}>Posts scored by saves, shares, comments, and conversion activity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {topPosts.map((post) => {
            const score = repurposeScore(post);
            return (
              <div key={post.id} className="flex items-center gap-4 p-3 rounded-2xl" style={{ background: C.ivory }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: C.warmBlack }}>{post.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.charcoal }}>{post.platform} · {post.saves} saves · {post.shares} shares</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Progress value={score} className="w-20 h-1.5" />
                  <span className="text-xs font-semibold w-6" style={{ color: score >= 70 ? C.forest : C.gold }}>{score}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <RefreshCcw className="w-4 h-4" style={{ color: C.forest }} />
                Repurpose Recommendations
              </CardTitle>
              <CardDescription style={{ color: C.charcoal }}>What to do with your best content, ranked by priority.</CardDescription>
            </div>
            <div className="flex gap-1.5">
              {(["All","High","Medium","Low"] as const).map((p) => (
                <button key={p} onClick={() => setFilter(p)} className="text-xs px-3 py-1.5 rounded-full border transition-colors" style={{ background: filter === p ? C.forest : C.ivory, color: filter === p ? C.bone : C.charcoal, borderColor: filter === p ? C.forest : "#DDD7CD" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.map((rec) => {
            const color = ACTION_COLORS[rec.recommendation] ?? C.charcoal;
            return (
              <div key={rec.id} className="flex items-start gap-3 p-4 rounded-2xl border" style={{ background: C.ivory, borderColor: "#DDD7CD" }}>
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: C.warmBlack }}>{rec.postTitle}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.charcoal }}>{rec.trigger}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: color+"22", color }}>{rec.recommendation}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: rec.priority === "High" ? C.forest+"22" : rec.priority === "Medium" ? C.gold+"33" : "#DDD7CD", color: rec.priority === "High" ? C.forest : C.charcoal }}>
                    {rec.priority}
                  </span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-center py-8" style={{ color: C.charcoal }}>No recommendations for this priority level.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
