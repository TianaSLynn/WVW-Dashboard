"use client";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Copy, Loader2, RefreshCcw, Sparkles, X } from "lucide-react";
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

function useStream() {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (url: string, body: object) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setOutput("");
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((p) => p + dec.decode(value, { stream: true }));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setOutput(`[Error: ${(err as Error).message}]`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const stop = useCallback(() => abortRef.current?.abort(), []);
  return { output, loading, run, stop, clear: () => setOutput("") };
}

interface Props { posts: ContentPost[] }

export default function RepurposingEngine({ posts }: Props) {
  const [filter, setFilter] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [activeRepurpose, setActiveRepurpose] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const stream = useStream();

  const recs = useMemo(() => generateRepurposeRecommendations(posts), [posts]);
  const filtered = filter === "All" ? recs : recs.filter((r) => r.priority === filter);

  const topPosts = useMemo(() =>
    [...posts].sort((a, b) => repurposeScore(b) - repurposeScore(a)).slice(0, 5),
    [posts]
  );

  const generate = (rec: ReturnType<typeof generateRepurposeRecommendations>[number]) => {
    const post = posts.find((p) => p.id === rec.postId);
    setActiveRepurpose(rec.id);
    stream.run("/api/generate/repurpose", {
      postTitle:      rec.postTitle,
      postPlatform:   rec.platform,
      topic:          post?.topicCategory ?? "",
      recommendation: rec.recommendation,
    });
  };

  const closePanel = () => {
    stream.stop();
    stream.clear();
    setActiveRepurpose(null);
    setCopied(false);
  };

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
              <CardDescription style={{ color: C.charcoal }}>Click any action button to generate that format with Claude.</CardDescription>
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
            const isActive = activeRepurpose === rec.id;
            return (
              <div key={rec.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: isActive ? color : "#DDD7CD" }}>
                <div className="flex items-start gap-3 p-4" style={{ background: C.ivory }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: C.warmBlack }}>{rec.postTitle}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.charcoal }}>{rec.trigger}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: rec.priority === "High" ? C.forest+"22" : rec.priority === "Medium" ? C.gold+"33" : "#DDD7CD", color: rec.priority === "High" ? C.forest : C.charcoal }}>
                      {rec.priority}
                    </span>
                    <button
                      type="button"
                      onClick={() => isActive ? closePanel() : generate(rec)}
                      disabled={stream.loading && !isActive}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40"
                      style={{ background: isActive ? color : color+"18", color, borderColor: color }}
                    >
                      {isActive && stream.loading
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
                        : isActive
                        ? <><X className="w-3 h-3" /> Close</>
                        : <><Sparkles className="w-3 h-3" /> {rec.recommendation}</>
                      }
                    </button>
                  </div>
                </div>

                {isActive && (
                  <div className="border-t" style={{ borderColor: color + "44", background: C.bone }}>
                    <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: `1px solid ${color}22` }}>
                      <span className="text-xs font-semibold" style={{ color }}>{rec.recommendation}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(stream.output).catch(() => {});
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        disabled={!stream.output || stream.loading}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl transition-colors disabled:opacity-40"
                        style={{ background: copied ? color : "#DDD7CD", color: copied ? C.bone : C.charcoal }}
                      >
                        <Copy className="w-3 h-3" />
                        {copied ? "Copied!" : "Copy all"}
                      </button>
                    </div>
                    <div className="p-4">
                      {stream.loading && !stream.output && (
                        <div className="flex items-center gap-2 text-xs py-2" style={{ color: C.charcoal }}>
                          <Loader2 className="w-4 h-4 animate-spin" style={{ color }} /> Generating {rec.recommendation.toLowerCase()}…
                        </div>
                      )}
                      {stream.output && (
                        <pre className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: C.charcoal, maxHeight: "20rem", overflowY: "auto" }}>
                          {stream.output}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-sm text-center py-8" style={{ color: C.charcoal }}>No recommendations for this priority level.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
