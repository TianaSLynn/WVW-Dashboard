"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Clock, MessageSquare } from "lucide-react";
import type { AudienceInsight, BehaviorTag } from "@/types/dashboard";

const C = { forest:"#1C3A2A", bone:"#F5F0E8", rose:"#C4A09A", gold:"#B8A06A", charcoal:"#3D3935", sage:"#4A5E4F", ivory:"#F9F5ED", warmBlack:"#1A1714" };

const TAG_COLORS: Record<BehaviorTag, string> = {
  "Lead":                       C.forest,
  "Potential Client":           "#A0522D",
  "Engager":                    C.gold,
  "Sharer":                     "#0A66C2",
  "Collaborator":               C.sage,
  "Returning Community Member": C.rose,
  "Lurker":                     "#9CA3AF",
};

interface Props { insights: AudienceInsight[] }

export default function AudienceInsights({ insights }: Props) {
  const [selected, setSelected] = useState<AudienceInsight | null>(null);

  const tagCounts: Record<string, number> = {};
  insights.forEach((i) => { tagCounts[i.behaviorTag] = (tagCounts[i.behaviorTag] ?? 0) + 1; });

  const topPainPoints = [...new Set(insights.map((i) => i.painPoint))].slice(0, 6);
  const topQuestions  = [...new Set(insights.map((i) => i.repeatedQuestion).filter((q) => !q.startsWith("(no")))].slice(0, 5);

  const activeTimes = insights.reduce<Record<string, number>>((acc, i) => {
    acc[i.activeTime] = (acc[i.activeTime] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* ── Behavior tag overview ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {Object.entries(tagCounts).map(([tag, count]) => (
          <div key={tag} className="flex flex-col items-center p-3 rounded-2xl text-center" style={{ background: C.bone, border: `1px solid #DDD7CD` }}>
            <div className="w-3 h-3 rounded-full mb-2" style={{ background: TAG_COLORS[tag as BehaviorTag] ?? C.charcoal }} />
            <span className="text-xs font-medium" style={{ color: C.warmBlack }}>{count}</span>
            <span className="text-[10px] mt-0.5 leading-tight" style={{ color: C.charcoal }}>{tag}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* ── Audience cards ── */}
        <Card className="xl:col-span-2 rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: C.forest }} />
              Audience Segments
            </CardTitle>
            <CardDescription style={{ color: C.charcoal }}>Click any segment to view pain points and questions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-2xl cursor-pointer transition-colors border"
                style={{
                  background: selected?.id === insight.id ? C.forest + "08" : C.ivory,
                  borderColor: selected?.id === insight.id ? C.forest + "44" : "#DDD7CD",
                }}
                onClick={() => setSelected(selected?.id === insight.id ? null : insight)}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: C.warmBlack }}>{insight.platform}</span>
                      <span className="text-xs" style={{ color: C.charcoal }}>· {insight.ageRange} · {insight.location}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-xs" style={{ color: C.charcoal }}>
                        <Clock className="w-3 h-3" /> {insight.activeTime}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ background: (TAG_COLORS[insight.behaviorTag] ?? C.charcoal) + "22", color: TAG_COLORS[insight.behaviorTag] ?? C.charcoal }}>
                    {insight.behaviorTag}
                  </span>
                </div>
                {selected?.id === insight.id && (
                  <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: "#DDD7CD" }}>
                    <div>
                      <p className="text-[10px] font-medium mb-1" style={{ color: C.charcoal }}>PAIN POINT</p>
                      <p className="text-xs" style={{ color: C.warmBlack }}>{insight.painPoint}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium mb-1" style={{ color: C.charcoal }}>REPEATED QUESTION</p>
                      <p className="text-xs" style={{ color: C.warmBlack }}>{insight.repeatedQuestion}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium mb-1" style={{ color: C.charcoal }}>COMMON COMMENT</p>
                      <p className="text-xs italic" style={{ color: C.charcoal }}>"{insight.commonComment}"</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Right column ── */}
        <div className="space-y-4">
          <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" style={{ color: C.forest }} />
                Repeated Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topQuestions.map((q, i) => (
                <div key={i} className="flex gap-2 p-3 rounded-2xl" style={{ background: C.ivory }}>
                  <span className="text-xs font-medium shrink-0" style={{ color: C.gold }}>{i + 1}.</span>
                  <p className="text-xs" style={{ color: C.charcoal }}>{q}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-base">Core Pain Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topPainPoints.map((p, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: i % 2 === 0 ? C.forest : C.rose }} />
                  <p className="text-xs" style={{ color: C.charcoal }}>{p}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-base flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: C.forest }} />
                Peak Active Times
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(activeTimes).map(([time, count]) => (
                <div key={time} className="flex items-center gap-3">
                  <span className="text-xs w-36 shrink-0" style={{ color: C.charcoal }}>{time}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#DDD7CD" }}>
                    <div className="h-full rounded-full" style={{ width: `${(count / insights.length) * 100}%`, background: C.forest }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
