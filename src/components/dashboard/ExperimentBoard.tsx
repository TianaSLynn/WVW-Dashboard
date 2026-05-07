"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FlaskConical, CheckCircle2, XCircle, Minus, HelpCircle } from "lucide-react";
import type { Experiment, ExperimentResult } from "@/types/dashboard";

const C = { forest:"#1C3A2A", bone:"#F5F0E8", rose:"#C4A09A", gold:"#B8A06A", charcoal:"#3D3935", sage:"#4A5E4F", ivory:"#F9F5ED", warmBlack:"#1A1714" };

const RESULT_CONFIG: Record<ExperimentResult, { color: string; Icon: React.ElementType; bg: string }> = {
  "Successful":      { color: C.forest,   Icon: CheckCircle2, bg: C.forest+"22" },
  "Neutral":         { color: C.charcoal, Icon: Minus,        bg: "#DDD7CD"      },
  "Failed":          { color: "#B91C1C",  Icon: XCircle,      bg: "#FEE2E2"      },
  "Needs More Data": { color: C.gold,     Icon: HelpCircle,   bg: C.gold+"33"    },
};

interface Props { experiments: Experiment[] }

export default function ExperimentBoard({ experiments }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<ExperimentResult | "All">("All");

  const filtered = filterResult === "All" ? experiments : experiments.filter((e) => e.result === filterResult);

  const counts: Record<string, number> = { Successful: 0, Neutral: 0, Failed: 0, "Needs More Data": 0 };
  experiments.forEach((e) => { if (e.result) counts[e.result]++; });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(RESULT_CONFIG) as ExperimentResult[]).map((result) => {
          const { color, Icon, bg } = RESULT_CONFIG[result];
          return (
            <Card key={result} className="rounded-2xl shadow-none cursor-pointer" style={{ background: filterResult === result ? bg : C.bone, borderColor: filterResult === result ? color : "#DDD7CD" }} onClick={() => setFilterResult(filterResult === result ? "All" : result)}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" style={{ color }} />
                <div>
                  <p className="text-lg font-serif font-semibold" style={{ color }}>{counts[result]}</p>
                  <p className="text-[10px]" style={{ color: C.charcoal }}>{result}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <FlaskConical className="w-4 h-4" style={{ color: C.forest }} />
            Experiment Board
          </CardTitle>
          <CardDescription style={{ color: C.charcoal }}>Documented tests, hypotheses, and learnings. Click any experiment to expand.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.map((exp) => {
            const cfg = exp.result ? RESULT_CONFIG[exp.result] : null;
            const isOpen = selected === exp.id;
            return (
              <div key={exp.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: "#DDD7CD" }}>
                <div className="p-4 cursor-pointer" style={{ background: isOpen ? C.ivory : C.bone }} onClick={() => setSelected(isOpen ? null : exp.id)}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium" style={{ color: C.warmBlack }}>{exp.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: C.gold+"33", color: C.charcoal }}>{exp.testType}</span>
                      </div>
                      <p className="text-xs" style={{ color: C.charcoal }}>{exp.hypothesis}</p>
                    </div>
                    {cfg && (
                      <span className="text-[11px] px-2.5 py-1 rounded-full font-medium flex items-center gap-1 shrink-0" style={{ background: cfg.bg, color: cfg.color }}>
                        <cfg.Icon className="w-3 h-3" /> {exp.result}
                      </span>
                    )}
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3" style={{ background: C.ivory }}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                      {[
                        ["Variable",   exp.variable],
                        ["Start",      new Date(exp.startDate).toLocaleDateString("en-US",{month:"short",day:"numeric"})],
                        ["End",        exp.endDate ? new Date(exp.endDate).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "Ongoing"],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <p className="text-[10px] font-medium mb-0.5" style={{ color: C.charcoal }}>{label}</p>
                          <p className="text-xs" style={{ color: C.warmBlack }}>{val}</p>
                        </div>
                      ))}
                    </div>
                    {exp.insight && (
                      <div className="p-3 rounded-xl" style={{ background: C.forest+"11", borderLeft: `3px solid ${C.forest}` }}>
                        <p className="text-[10px] font-medium mb-1" style={{ color: C.forest }}>INSIGHT</p>
                        <p className="text-xs" style={{ color: C.charcoal }}>{exp.insight}</p>
                      </div>
                    )}
                    {exp.nextMove && (
                      <div className="p-3 rounded-xl" style={{ background: C.gold+"22", borderLeft: `3px solid ${C.gold}` }}>
                        <p className="text-[10px] font-medium mb-1" style={{ color: C.charcoal }}>NEXT MOVE</p>
                        <p className="text-xs" style={{ color: C.warmBlack }}>{exp.nextMove}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
