"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import type { ContentPost } from "@/types/dashboard";
import { generateInsights } from "@/utils/recommendations";
import { topPerformingPlatform, platformAvgEngagement, calcEngagementRate } from "@/utils/calculations";

const C = { forest:"#1C3A2A", bone:"#F5F0E8", rose:"#C4A09A", gold:"#B8A06A", charcoal:"#3D3935", sage:"#4A5E4F", ivory:"#F9F5ED", warmBlack:"#1A1714" };

interface Props { posts: ContentPost[] }

export default function AIInsightsPanel({ posts }: Props) {
  const insights = generateInsights(posts);
  const topPlat  = topPerformingPlatform(posts);
  const platAvgs = platformAvgEngagement(posts);
  const converters = posts.filter((p) => p.conversionFlag);
  const avgEng = posts.length ? posts.reduce((s, p) => s + calcEngagementRate(p), 0) / posts.length : 0;

  const topType = (() => {
    const m: Record<string, number[]> = {};
    posts.forEach((p) => { if (!m[p.contentType]) m[p.contentType] = []; m[p.contentType].push(calcEngagementRate(p)); });
    return Object.entries(m).sort((a, b) => (b[1].reduce((s,r)=>s+r,0)/b[1].length) - (a[1].reduce((s,r)=>s+r,0)/a[1].length))[0]?.[0] ?? "—";
  })();

  const quickStats = [
    { label: "Avg Engagement", value: `${avgEng.toFixed(1)}%`,         icon: TrendingUp, color: C.forest },
    { label: "Top Platform",   value: topPlat,                          icon: Sparkles,   color: C.gold   },
    { label: "Top Format",     value: topType,                          icon: Brain,      color: C.sage   },
    { label: "Conversions",    value: `${converters.length} posts`,     icon: AlertCircle, color: "#A0522D" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickStats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="rounded-2xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg" style={{ background: color + "20" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <span className="text-xs" style={{ color: C.charcoal }}>{label}</span>
              </div>
              <p className="text-base font-semibold font-serif" style={{ color: C.warmBlack }}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Brain className="w-5 h-5" style={{ color: C.forest }} />
            Strategic Observations
          </CardTitle>
          <CardDescription style={{ color: C.charcoal }}>Rule-based intelligence derived from your post performance data.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-2xl" style={{ background: C.ivory }}>
              <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: i % 3 === 0 ? C.forest : i % 3 === 1 ? C.gold : C.rose }} />
              <p className="text-sm leading-relaxed" style={{ color: C.charcoal }}>{insight}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Platform Intelligence Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(platAvgs).sort((a, b) => b[1] - a[1]).map(([plat, avg]) => (
              <div key={plat} className="flex items-center gap-4">
                <span className="text-xs w-40 shrink-0" style={{ color: C.charcoal }}>{plat}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#DDD7CD" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, avg * 5)}%`, background: plat === topPlat ? C.forest : C.gold }} />
                </div>
                <span className="text-xs font-medium w-12 text-right" style={{ color: C.warmBlack }}>{avg}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
