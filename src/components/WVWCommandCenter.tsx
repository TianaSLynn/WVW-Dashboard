"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Filter,
  FolderKanban,
  Gauge,
  Globe,
  Lightbulb,
  Link2,
  Loader2,
  Mail,
  Megaphone,
  MessageSquareQuote,
  Play,
  RefreshCcw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ContentPerformanceTable from "@/components/dashboard/ContentPerformanceTable";
import AIInsightsPanel        from "@/components/dashboard/AIInsightsPanel";
import AudienceInsights       from "@/components/dashboard/AudienceInsights";
import CommunityLeads         from "@/components/dashboard/CommunityLeads";
import ConversionEngine       from "@/components/dashboard/ConversionEngine";
import ExperimentBoard        from "@/components/dashboard/ExperimentBoard";
import RepurposingEngine      from "@/components/dashboard/RepurposingEngine";
import ReportsSection         from "@/components/dashboard/ReportsSection";
import { samplePosts, sampleAudience, sampleInteractions, sampleConversions, sampleExperiments } from "@/data/sampleData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";

// ─── Brand colours ────────────────────────────────────────────────
const C = {
  forest:    "#1C3A2A",
  warmBlack: "#1A1714",
  bone:      "#F5F0E8",
  rose:      "#C4A09A",
  gold:      "#B8A06A",
  charcoal:  "#3D3935",
  sage:      "#4A5E4F",
  ivory:     "#F9F5ED",
};

// ─── Static reference data ────────────────────────────────────────
const socialSummary = [
  { platform: "LinkedIn Personal", followers: 4281, engagement: 6.8, ctr: 4.1, posts: 11, leadScore: 82 },
  { platform: "LinkedIn WVW",      followers: 1905, engagement: 5.2, ctr: 3.7, posts: 8,  leadScore: 76 },
  { platform: "Instagram",         followers: 3210, engagement: 7.3, ctr: 2.8, posts: 14, leadScore: 64 },
  { platform: "TikTok",            followers: 2640, engagement: 8.9, ctr: 1.9, posts: 9,  leadScore: 58 },
  { platform: "Threads",           followers: 1112, engagement: 4.9, ctr: 2.1, posts: 7,  leadScore: 51 },
  { platform: "Facebook",          followers: 1630, engagement: 3.1, ctr: 1.4, posts: 6,  leadScore: 42 },
  { platform: "Bluesky",           followers: 930,  engagement: 6.1, ctr: 1.8, posts: 10, leadScore: 48 },
];

const monthlyTrend = [
  { month: "Jan", engagement: 4.4, leads: 11, newsletter: 120 },
  { month: "Feb", engagement: 5.1, leads: 16, newsletter: 164 },
  { month: "Mar", engagement: 6.2, leads: 22, newsletter: 201 },
  { month: "Apr", engagement: 6.9, leads: 29, newsletter: 244 },
  { month: "May", engagement: 7.4, leads: 32, newsletter: 281 },
  { month: "Jun", engagement: 7.0, leads: 30, newsletter: 272 },
];

const contentPillars = [
  { pillar: "Black Mental Health",    strength: 92 },
  { pillar: "Psychological Safety",   strength: 88 },
  { pillar: "Neuroinclusion",         strength: 84 },
  { pillar: "Burnout / Moral Injury", strength: 91 },
  { pillar: "CEO / BTS",              strength: 76 },
  { pillar: "Unicorn Wisdoms",        strength: 86 },
];

const topThemes = [
  { theme: "Burnout vs moral injury",                    source: "Reddit + LinkedIn",        momentum: "High",   action: "Build essay + carousel + short video" },
  { theme: "Neurodivergent overwhelm at work",           source: "Reddit",                   momentum: "High",   action: "Create compassionate authority series" },
  { theme: "Black women carrying emotional labor",        source: "Reddit + comments",        momentum: "High",   action: "Newsletter + panel prompt" },
  { theme: "Psychological safety without accountability", source: "LinkedIn + niche discourse",momentum: "Medium", action: "Thought piece + consultant CTA" },
  { theme: "Soft ambition and sustainable leadership",    source: "Audience behavior",        momentum: "Medium", action: "Unicorn Wisdom + reel + blog bridge" },
];

const newsletters = [
  { name: "Ease, Power, Blackness", opens: 47, clicks: 8.4, saves: 122, favoriteScore: 93 },
  { name: "Black Excellence",       opens: 43, clicks: 7.1, saves: 104, favoriteScore: 86 },
  { name: "The Brief",              opens: 38, clicks: 9.2, saves: 68,  favoriteScore: 79 },
];

const defaultUnicornBank = [
  "Softness is the look. Standards are the requirement.",
  "Rest is not proof that you have given up. It is proof that you intend to continue.",
  "Some systems call your pain a weakness because they benefit from your silence.",
  "Luxury is not excess. Sometimes it is finally being handled with care.",
  "You are not difficult to support. The system may simply be badly designed.",
];

// ─── Types ────────────────────────────────────────────────────────
interface RedditSignal {
  theme: string;
  source: string;
  score: number;
  comments: number;
  momentum: string;
  relevance: number;
  action: string;
  url: string;
  age: number;
}

interface ContentItem {
  id: string;
  date: string;
  channel: string;
  topic: string;
  theme: string;
  status: string;
  content_type: string;
}

interface ContentData {
  rows: ContentItem[];
  byPlatform: Record<string, number>;
  byStatus: Record<string, number>;
  byTheme: Record<string, number>;
  total: number;
}

interface PostLogEntry {
  id: string;
  timestamp: string;
  platform: string;
  theme: string;
  excerpt: string;
  status: "posted" | "queued" | "error" | "skipped";
}

interface PostingStatus {
  connections: Record<string, boolean>;
  todayPlatforms: string[];
  todayTheme: string;
  schedule: Record<string, string[]>;
  recentPosts: PostLogEntry[];
}

// ─── Claude streaming hook ────────────────────────────────────────
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
        setOutput("[Generation error — check your ANTHROPIC_API_KEY in .env.local]");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const stop = useCallback(() => abortRef.current?.abort(), []);
  return { output, loading, run, stop, clear: () => setOutput("") };
}

// ─── Momentum badge ───────────────────────────────────────────────
function MomentumBadge({ level }: { level: string }) {
  const color = level === "High"
    ? "bg-[#1C3A2A] text-[#F5F0E8]"
    : "bg-[#B8A06A]/20 text-[#3D3935]";
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{level}</span>;
}

// ─── Output modal ─────────────────────────────────────────────────
function OutputPanel({
  title, output, loading, onClose, onCopy,
}: {
  title: string;
  output: string;
  loading: boolean;
  onClose: () => void;
  onCopy: () => void;
}) {
  const isMonthPlan = title.includes("Month");
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1714]/60 backdrop-blur-sm"
    >
      <div className={`w-full ${isMonthPlan ? "max-w-5xl" : "max-w-2xl"} max-h-[90vh] flex flex-col rounded-3xl bg-[#F5F0E8] shadow-2xl overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDD7CD]">
          <h3 className="font-serif text-lg font-semibold text-[#1A1714]">{title}</h3>
          <div className="flex gap-2">
            {output && (
              <Button size="sm" variant="outline" className="rounded-xl" onClick={onCopy}>
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
              </Button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[#EDE8DF] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && !output && (
            <div className="flex items-center gap-2 text-[#3D3935] text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Building your monthly content plan…</span>
            </div>
          )}
          {output && isMonthPlan ? (
            <MonthPlanDisplay raw={output} loading={loading} />
          ) : output ? (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[#1A1714] font-sans">
              {output}
              {loading && <span className="animate-pulse">▌</span>}
            </pre>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Month plan renderer ──────────────────────────────────────────
interface WeekPost { day: string; platform: string; format: string; angle: string; }
interface Week { week: number; dates: string; theme: string; pillar: string; intent: string; posts: WeekPost[]; }
interface NewsletterItem { date: string; series: string; theme: string; }
interface RepurposeItem { source: string; repurpose: string[]; }
interface MonthPlan { month: string; focus: string; weeks: Week[]; newsletterPlan: NewsletterItem[]; repurposeMap: RepurposeItem[]; }

function MonthPlanDisplay({ raw, loading }: { raw: string; loading: boolean }) {
  const plan = useMemo<MonthPlan | null>(() => {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]) as MonthPlan; } catch { return null; }
  }, [raw]);

  if (!plan) {
    return (
      <pre className="text-xs leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[32rem]" style={{ color: C.charcoal }}>
        {raw}{loading && <span className="animate-pulse">▌</span>}
      </pre>
    );
  }

  const platformColor: Record<string, string> = {
    "LinkedIn Personal": C.forest,
    "LinkedIn WVW": C.sage,
    "Instagram": C.rose,
    "Threads": C.charcoal,
    "Twitter": "#1DA1F2",
    "Facebook": "#4267B2",
    "Bluesky": "#0085ff",
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl" style={{ background: C.ivory }}>
        <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Monthly Focus</p>
        <p className="font-serif text-base font-medium">{plan.focus}</p>
      </div>

      {plan.weeks?.map((week) => (
        <div key={week.week} className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: C.forest, color: C.bone }}>
              Week {week.week} · {week.dates}
            </span>
            <span className="font-serif text-base font-semibold">{week.theme}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.gold + "33", color: C.charcoal }}>{week.pillar}</span>
          </div>
          <p className="text-xs" style={{ color: C.charcoal }}>{week.intent}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {week.posts?.map((post, i) => (
              <div key={i} className="p-3 rounded-2xl border text-xs space-y-1" style={{ borderColor: "#DDD7CD", background: C.ivory }}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs" style={{ color: C.charcoal }}>{post.day}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: (platformColor[post.platform] ?? C.charcoal) + "22", color: platformColor[post.platform] ?? C.charcoal }}>
                    {post.platform}
                  </span>
                </div>
                <span className="block text-xs" style={{ color: C.sage }}>{post.format}</span>
                <p style={{ color: C.warmBlack }}>{post.angle}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {plan.newsletterPlan?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: C.charcoal }}>Newsletter Schedule</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {plan.newsletterPlan.map((nl, i) => (
              <div key={i} className="p-3 rounded-2xl text-xs" style={{ background: C.ivory, borderColor: "#DDD7CD" }}>
                <p className="font-medium" style={{ color: C.charcoal }}>{nl.date}</p>
                <p className="text-xs" style={{ color: C.forest }}>{nl.series}</p>
                <p style={{ color: C.warmBlack }}>{nl.theme}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.repurposeMap?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium" style={{ color: C.charcoal }}>Repurpose Map</p>
          {plan.repurposeMap.map((r, i) => (
            <div key={i} className="p-3 rounded-2xl text-xs flex items-start gap-3" style={{ background: C.ivory }}>
              <span className="font-medium shrink-0" style={{ color: C.warmBlack }}>{r.source}</span>
              <span style={{ color: C.charcoal }}>→</span>
              <span style={{ color: C.charcoal }}>{r.repurpose.join(" · ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────
export default function WVWCommandCenter() {
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("Burnout / Moral Injury");
  const [contentData, setContentData] = useState<ContentData | null>(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [modal, setModal] = useState<{ title: string } | null>(null);
  const [postingStatus, setPostingStatus] = useState<PostingStatus | null>(null);
  const [postingLoading, setPostingLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);
  const [wisdomTriggering, setWisdomTriggering] = useState(false);
  const [wisdomResult, setWisdomResult] = useState<string | null>(null);
  const [statusDebug, setStatusDebug] = useState<string | null>(null);
  const [redditSignals, setRedditSignals] = useState<RedditSignal[]>([]);
  const [redditLoading, setRedditLoading] = useState(true);
  const [redditFetchedAt, setRedditFetchedAt] = useState<string | null>(null);
  const [monthPlanData, setMonthPlanData] = useState<Record<string, unknown> | null>(null);
  const [monthPlanLoading, setMonthPlanLoading] = useState(false);
  const [monthPlanOpen, setMonthPlanOpen] = useState(false);

  // ── Calendar state ──
  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [calEntries, setCalEntries] = useState<{ id: string; date: string; platform: string; theme: string; status: string; excerpt: string }[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [calSelected, setCalSelected] = useState<string | null>(null);

  // ── Theme of Month state ──
  const [themeOfMonth, setThemeOfMonthState] = useState<string | null>(null);
  const [settingTheme, setSettingTheme] = useState(false);

  // ── Substack state ──
  const [ssTheme, setSsTheme] = useState("");
  const [ssAngle, setSsAngle] = useState("");
  const [ssLoading, setSsLoading] = useState(false);
  const [ssResult, setSsResult] = useState<{ title: string; subtitle: string; content_markdown: string } | null>(null);
  const [ssError, setSsError] = useState<string | null>(null);
  const [ssCopied, setSsCopied] = useState(false);

  // ── Publish tab state ──
  const [nlSeries, setNlSeries] = useState("Ease, Power, Blackness");
  const [nlTheme, setNlTheme] = useState("");
  const [nlTone, setNlTone] = useState("");
  const [nlLoading, setNlLoading] = useState(false);
  const [nlResult, setNlResult] = useState<{
    generated: { subject: string; preview_text: string; content_html: string };
    beehiiv: Record<string, unknown> | null;
  } | null>(null);
  const [nlError, setNlError] = useState<string | null>(null);
  const [blogTheme, setBlogTheme] = useState("");
  const [blogAngle, setBlogAngle] = useState("");
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogResult, setBlogResult] = useState<{
    title: string;
    meta_description: string;
    content_markdown: string;
  } | null>(null);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [blogCopied, setBlogCopied] = useState(false);

  const themeStream  = useStream();
  const wisdomStream = useStream();
  const activeStream = modal?.title.includes("Theme") ? themeStream : wisdomStream;

  // ── Fetch real content data ──
  useEffect(() => {
    fetch("/api/data/content")
      .then((r) => r.json())
      .then((d: ContentData) => setContentData(d))
      .catch(() => setContentData(null))
      .finally(() => setContentLoading(false));
  }, []);

  const refreshContent = () => {
    setContentLoading(true);
    fetch("/api/data/content")
      .then((r) => r.json())
      .then((d: ContentData) => setContentData(d))
      .catch(() => {})
      .finally(() => setContentLoading(false));
  };

  useEffect(() => {
    fetch("/api/posting/status", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`Status ${r.status}`);
        return r.json();
      })
      .then((d: PostingStatus) => setPostingStatus(d))
      .catch((err) => console.error("[posting/status]", err))
      .finally(() => setPostingLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/reddit")
      .then((r) => r.json())
      .then((d: { signals: RedditSignal[]; fetchedAt: string }) => {
        setRedditSignals(d.signals ?? []);
        setRedditFetchedAt(d.fetchedAt ?? null);
      })
      .catch(() => {})
      .finally(() => setRedditLoading(false));
  }, []);

  // ── Fetch calendar data when month changes ──
  useEffect(() => {
    setCalLoading(true);
    fetch(`/api/calendar?year=${calYear}&month=${calMonth}`)
      .then((r) => r.json())
      .then((d: { entries: typeof calEntries }) => setCalEntries(d.entries ?? []))
      .catch(() => {})
      .finally(() => setCalLoading(false));
  }, [calYear, calMonth]);

  // ── Fetch theme of month ──
  useEffect(() => {
    fetch("/api/settings/theme-of-month")
      .then((r) => r.json())
      .then((d: { theme: string | null }) => setThemeOfMonthState(d.theme))
      .catch(() => {});
  }, []);

  const setThemeOfMonth = async (theme: string) => {
    setSettingTheme(true);
    try {
      await fetch("/api/settings/theme-of-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      setThemeOfMonthState(theme);
    } finally {
      setSettingTheme(false);
    }
  };

  const triggerPosting = async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch("/api/posting/trigger", { method: "POST" });
      const data = await res.json();
      const summary = Object.entries(data.results ?? {})
        .map(([p, r]) => `${p}: ${(r as { status: string }).status}`)
        .join(" · ");
      setTriggerResult(summary || "Done");
      // Refresh status after posting
      fetch("/api/posting/status")
        .then((r) => r.json())
        .then((d: PostingStatus) => setPostingStatus(d))
        .catch(() => {});
    } catch {
      setTriggerResult("Error — check your credentials in .env.local");
    } finally {
      setTriggering(false);
    }
  };

  const triggerWisdom = async () => {
    setWisdomTriggering(true);
    setWisdomResult(null);
    try {
      const res = await fetch("/api/posting/trigger-wisdom", { method: "POST" });
      const data = await res.json() as { wisdom?: string; results?: Record<string, { status: string }> };
      const summary = Object.entries(data.results ?? {})
        .map(([p, r]) => `${p.replace(/_/g, " ")}: ${r.status}`)
        .join(" · ");
      setWisdomResult(data.wisdom ? `"${data.wisdom.slice(0, 60)}…" — ${summary || "sent"}` : "Done");
      fetch("/api/posting/status").then((r) => r.json()).then((d: PostingStatus) => setPostingStatus(d)).catch(() => {});
    } catch {
      setWisdomResult("Error — check credentials");
    } finally {
      setWisdomTriggering(false);
    }
  };

  const generateSubstack = async () => {
    if (!ssTheme.trim()) return;
    setSsLoading(true);
    setSsResult(null);
    setSsError(null);
    try {
      const res = await fetch("/api/substack/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: ssTheme, angle: ssAngle || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Generation failed");
      setSsResult(data as typeof ssResult);
    } catch (err) {
      setSsError((err as Error).message);
    } finally {
      setSsLoading(false);
    }
  };

  const generateNewsletter = async () => {
    if (!nlTheme.trim()) return;
    setNlLoading(true);
    setNlResult(null);
    setNlError(null);
    try {
      const res = await fetch("/api/newsletter/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ series: nlSeries, theme: nlTheme, tone: nlTone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Generation failed");
      setNlResult(data as typeof nlResult);
    } catch (err) {
      setNlError((err as Error).message);
    } finally {
      setNlLoading(false);
    }
  };

  const generateBlog = async () => {
    if (!blogTheme.trim()) return;
    setBlogLoading(true);
    setBlogResult(null);
    setBlogError(null);
    try {
      const res = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: blogTheme, angle: blogAngle || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Generation failed");
      setBlogResult(data as typeof blogResult);
    } catch (err) {
      setBlogError((err as Error).message);
    } finally {
      setBlogLoading(false);
    }
  };

  // ── Claude: generate theme pack ──
  const generateTheme = () => {
    setModal({ title: "Theme Pack — " + selectedTheme });
    themeStream.run("/api/generate/theme", { theme: selectedTheme });
  };

  // ── Claude: wisdom mode ──
  const runWisdom = (mode: string, label: string, extra?: object) => {
    setModal({ title: label });
    wisdomStream.run("/api/generate/wisdom", { mode, ...extra });
  };

  const closeModal = () => {
    activeStream.stop();
    setModal(null);
  };

  const buildMonth = async () => {
    setMonthPlanLoading(true);
    setMonthPlanOpen(true);
    setMonthPlanData(null);
    try {
      const month = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
      const res = await fetch("/api/generate/month-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      const data = await res.json() as Record<string, unknown>;
      setMonthPlanData(data);
    } catch {
      setMonthPlanData({ error: "Generation failed" });
    } finally {
      setMonthPlanLoading(false);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(activeStream.output).catch(() => {});
  };

  // ── Content map: use real data if available, fall back to defaults ──
  const displayTopics = useMemo(() => {
    const source = contentData?.rows ?? [];
    const filtered = source.filter((item) =>
      `${item.channel} ${item.topic} ${item.status} ${item.theme}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
    return filtered.length > 0 ? filtered : [];
  }, [contentData, search]);

  const totalFollowers = socialSummary.reduce((s, r) => s + r.followers, 0);
  const avgEngagement = (socialSummary.reduce((s, r) => s + r.engagement, 0) / socialSummary.length).toFixed(1);
  const topPlatform = [...socialSummary].sort((a, b) => b.engagement - a.engagement)[0];
  const topNewsletter = [...newsletters].sort((a, b) => b.favoriteScore - a.favoriteScore)[0];

  // Derive content-count bar data from real CSV
  const platformBarData = contentData
    ? Object.entries(contentData.byPlatform).map(([platform, count]) => ({ platform, count }))
    : socialSummary.map((r) => ({ platform: r.platform, count: r.posts }));

  return (
    <>
      <AnimatePresence>
        {modal && (
          <OutputPanel
            title={modal.title}
            output={activeStream.output}
            loading={activeStream.loading}
            onClose={closeModal}
            onCopy={copyOutput}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {monthPlanOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1714]/60 backdrop-blur-sm"
          >
            <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden" style={{ background: "#F5F0E8" }}>
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#DDD7CD" }}>
                <h3 className="font-serif text-lg font-semibold" style={{ color: "#1A1714" }}>
                  Monthly Content Plan — {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
                </h3>
                <button type="button" title="Close" onClick={() => setMonthPlanOpen(false)} className="p-1.5 rounded-xl hover:bg-[#EDE8DF]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {monthPlanLoading && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: "#3D3935" }}>
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#1C3A2A" }} />
                    Building your content plan…
                  </div>
                )}
                {monthPlanData && !("error" in monthPlanData) && (
                  <MonthPlanDisplay raw={JSON.stringify(monthPlanData)} loading={false} />
                )}
                {monthPlanData && "error" in monthPlanData && (
                  <p className="text-sm" style={{ color: "#C4A09A" }}>Generation failed — try again.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen p-4 md:p-8" style={{ background: C.ivory, color: C.warmBlack }}>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: C.forest, color: C.bone }}
                >
                  WVW Command Center
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 text-xs"
                  style={{ borderColor: C.gold, color: C.charcoal }}
                >
                  Intelligence Hub
                </Badge>
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-semibold tracking-tight leading-none">
                Wholistic Vibes Wellness
              </h1>
              <p className="mt-2 text-sm md:text-base italic font-serif" style={{ color: C.gold }}>
                Soft in appearance. Uncompromising in practice.
              </p>
              <p className="mt-2 max-w-2xl text-sm" style={{ color: C.charcoal }}>
                Command your socials, newsletters, Reddit signals, monthly topics, Unicorn Wisdoms, and execution flow from one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="rounded-2xl text-sm"
                style={{ background: C.forest, color: C.bone }}
                onClick={refreshContent}
              >
                <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Button variant="outline" className="rounded-2xl text-sm opacity-50 cursor-not-allowed" style={{ borderColor: C.gold, color: C.charcoal }} title="Coming soon">
                <Megaphone className="w-4 h-4 mr-2" /> Auto-Post Queue
              </Button>
              <Button variant="outline" className="rounded-2xl text-sm opacity-50 cursor-not-allowed" style={{ borderColor: C.gold, color: C.charcoal }} title="Coming soon">
                <Bell className="w-4 h-4 mr-2" /> Alerts
              </Button>
            </div>
          </motion.div>

          {/* ── KPI row ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Total Audience",      value: totalFollowers.toLocaleString(), icon: Users,      note: "Estimated — update in socialSummary" },
              { label: "Avg Engagement",      value: `${avgEngagement}%`,             icon: Gauge,      note: "Estimated — update in socialSummary" },
              { label: "Top Platform",        value: topPlatform.platform,            icon: TrendingUp,  note: `${topPlatform.engagement}% est. engagement` },
              { label: "Favorite Newsletter", value: topNewsletter.name,              icon: FileText,    note: `Score ${topNewsletter.favoriteScore} · estimated` },
            ].map((item) => (
              <Card key={item.label} className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium" style={{ color: C.charcoal }}>{item.label}</p>
                      <h3 className="font-serif text-2xl font-semibold mt-1">{item.value}</h3>
                      <p className="text-xs mt-1.5" style={{ color: C.charcoal }}>{item.note}</p>
                    </div>
                    <div className="p-3 rounded-2xl" style={{ background: C.ivory }}>
                      <item.icon className="w-4 h-4" style={{ color: C.forest }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Tabs ── */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList
              className="flex flex-wrap gap-1 h-auto rounded-2xl p-1.5"
              style={{ background: C.bone, border: `1px solid #DDD7CD` }}
            >
              {[
                { value: "overview",      label: "Overview"     },
                { value: "socials",       label: "Socials"      },
                { value: "insights",      label: "Trends"       },
                { value: "newsletters",   label: "Newsletters"  },
                { value: "content",       label: "Content"      },
                { value: "wisdom",        label: "Wisdoms"      },
                { value: "autopost",      label: "Auto-Post"    },
                { value: "publish",       label: "Publish"      },
                { value: "calendar",      label: "Calendar"     },
                { value: "performance",   label: "Performance"  },
                { value: "intelligence",  label: "Intelligence" },
                { value: "audience",      label: "Audience"     },
                { value: "community",     label: "Community"    },
                { value: "conversions",   label: "Conversions"  },
                { value: "experiments",   label: "Experiments"  },
                { value: "repurpose",     label: "Repurpose"    },
                { value: "reports",       label: "Reports"      },
                { value: "settings",      label: "Settings"     },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-xl text-xs data-[state=active]:shadow-none"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Overview ── */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card className="xl:col-span-2 rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">
                      Growth + Performance Trend
                    </CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>Engagement, leads, and newsletter growth over time.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#DDD7CD" />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: C.charcoal }} />
                        <YAxis tick={{ fontSize: 12, fill: C.charcoal }} />
                        <Tooltip contentStyle={{ background: C.ivory, borderColor: "#DDD7CD", borderRadius: 12 }} />
                        <Line type="monotone" dataKey="engagement" stroke={C.forest}    strokeWidth={2} dot={false} name="Engagement %" />
                        <Line type="monotone" dataKey="leads"      stroke={C.gold}      strokeWidth={2} dot={false} name="Leads" />
                        <Line type="monotone" dataKey="newsletter" stroke={C.rose}      strokeWidth={2} dot={false} name="Newsletter Subs" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">What This Dashboard Does</CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>Real-time operational intelligence for WVW.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5 text-sm" style={{ color: C.charcoal }}>
                    {[
                      "Monitor all connected social metrics in one view",
                      "Surface which themes convert to leads",
                      "Recommend the next best post by platform",
                      "Track newsletter preference and subscriber behavior",
                      "Queue, approve, and auto-publish content",
                      "Pull niche pain points from Reddit and audience comments",
                      "Flag content gaps and brand drift instantly",
                      "Map one idea across blog, reel, carousel, post, and podcast",
                    ].map((f) => (
                      <div key={f} className="flex gap-2 items-start">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: C.forest }} />
                        <span>{f}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="rounded-3xl lg:col-span-2 shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">
                      Content Pillar Strength
                    </CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>What your audience responds to most.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={contentPillars}>
                        <PolarGrid stroke="#DDD7CD" />
                        <PolarAngleAxis dataKey="pillar" tick={{ fontSize: 11, fill: C.charcoal }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: C.charcoal }} />
                        <Radar dataKey="strength" stroke={C.forest} fill={C.forest} fillOpacity={0.2} />
                        <Tooltip contentStyle={{ background: C.ivory, borderColor: "#DDD7CD", borderRadius: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Today&apos;s CEO Focus</CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>
                      Strategic priorities based on today&apos;s theme, schedule, and platform activity. Use these to direct your morning work session.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      postingStatus ? `Today's theme: ${postingStatus.todayTheme} — generate posts for ${postingStatus.todayPlatforms.length} platform${postingStatus.todayPlatforms.length !== 1 ? "s" : ""}` : "Check today's theme in the Auto-Post tab",
                      "Pull this week's Reddit signal and match it to a content format",
                      "Generate and schedule this week's newsletter if not already queued",
                      "Check post log for any errors from the last cron run",
                    ].map((task) => (
                      <div
                        key={task}
                        className="flex items-start justify-between p-3 rounded-2xl"
                        style={{ background: C.ivory }}
                      >
                        <p className="text-sm max-w-[85%]" style={{ color: C.charcoal }}>{task}</p>
                        <ChevronRight className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.gold }} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Socials ── */}
            <TabsContent value="socials" className="space-y-4">
              <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                <CardHeader>
                  <CardTitle className="font-serif text-xl">
                    Platform Performance
                  </CardTitle>
                  <CardDescription style={{ color: C.charcoal }}>Cross-platform growth, engagement, posts, and lead value.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b" style={{ borderColor: "#DDD7CD" }}>
                          {["Platform", "Followers", "Engagement", "CTR", "Posts", "Lead Score"].map((h) => (
                            <th key={h} className="py-3 pr-4 font-medium text-xs" style={{ color: C.charcoal }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {socialSummary.map((row) => (
                          <tr key={row.platform} className="border-b last:border-0" style={{ borderColor: "#DDD7CD" }}>
                            <td className="py-2.5 pr-4 font-medium text-sm">{row.platform}</td>
                            <td className="pr-4 text-sm" style={{ color: C.charcoal }}>{row.followers.toLocaleString()}</td>
                            <td className="pr-4 text-sm" style={{ color: C.charcoal }}>{row.engagement}%</td>
                            <td className="pr-4 text-sm" style={{ color: C.charcoal }}>{row.ctr}%</td>
                            <td className="pr-4 text-sm" style={{ color: C.charcoal }}>{row.posts}</td>
                            <td className="text-sm font-medium" style={{ color: C.forest }}>{row.leadScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={socialSummary}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#DDD7CD" />
                        <XAxis dataKey="platform" hide />
                        <YAxis tick={{ fontSize: 11, fill: C.charcoal }} />
                        <Tooltip contentStyle={{ background: C.ivory, borderColor: "#DDD7CD", borderRadius: 12 }} />
                        <Bar dataKey="engagement" fill={C.forest} radius={[4, 4, 0, 0]} name="Engagement %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {["Auto-post approval queue", "Best posting-time engine", "Post-level lead attribution", "Top-performing hook library"].map((item) => (
                  <Card key={item} className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                    <CardContent className="p-5 flex items-center gap-3">
                      <div className="p-3 rounded-2xl" style={{ background: C.ivory }}>
                        <Workflow className="w-4 h-4" style={{ color: C.forest }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: C.charcoal }}>{item}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ── Reddit / Trends ── */}
            <TabsContent value="insights" className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card className="xl:col-span-2 rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Top Niche Signals</CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>Live Reddit signals from r/humanresources, r/blackmentalhealth, r/ADHD, r/neurodivergent, r/burnout, r/nonprofit — updated hourly.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {themeOfMonth && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl mb-1" style={{ background: C.forest + "18", border: `1px solid ${C.forest}33` }}>
                        <CalendarDays className="w-3.5 h-3.5 shrink-0" style={{ color: C.forest }} />
                        <span className="text-xs font-medium" style={{ color: C.forest }}>Theme of Month:</span>
                        <span className="text-xs" style={{ color: C.charcoal }}>{themeOfMonth}</span>
                      </div>
                    )}
                    {redditLoading ? (
                      <div className="flex items-center gap-2 text-sm py-4" style={{ color: C.charcoal }}>
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.forest }} />
                        Pulling live Reddit signals…
                      </div>
                    ) : redditSignals.length === 0 ? (
                      <p className="text-sm py-4" style={{ color: C.charcoal }}>No signals loaded. Refresh to retry.</p>
                    ) : (
                      redditSignals.slice(0, 8).map((signal, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-2xl border flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                          style={{ borderColor: "#DDD7CD" }}
                        >
                          <div className="flex-1">
                            <a href={signal.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:underline" style={{ color: C.warmBlack }}>
                              {signal.theme}
                            </a>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs" style={{ color: C.charcoal }}>{signal.source}</span>
                              <span className="text-xs" style={{ color: C.charcoal }}>· ↑{signal.score} · {signal.comments} comments · {signal.age}h ago</span>
                              <MomentumBadge level={signal.momentum} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className="text-xs px-3 py-1.5 rounded-full border"
                              style={{ borderColor: C.gold, color: C.charcoal }}
                            >
                              {signal.action}
                            </span>
                            <button
                              onClick={() => setThemeOfMonth(signal.theme)}
                              disabled={settingTheme || themeOfMonth === signal.theme}
                              className="text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40"
                              style={themeOfMonth === signal.theme
                                ? { background: C.forest, color: C.bone, borderColor: C.forest }
                                : { borderColor: C.forest, color: C.forest }
                              }
                              title="Set as Theme of Month"
                            >
                              {themeOfMonth === signal.theme ? "✓ Theme of Month" : "Set as Month Theme"}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    {redditFetchedAt && (
                      <p className="text-xs pt-2" style={{ color: C.charcoal }}>
                        Live · refreshes hourly · last pulled {new Date(redditFetchedAt).toLocaleTimeString()}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Theme Converter</CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>Turn one live theme into a complete content stack via Claude.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <select
                      className="w-full border rounded-2xl p-3 text-sm"
                      style={{ background: C.ivory, borderColor: "#DDD7CD", color: C.warmBlack }}
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value)}
                    >
                      {contentPillars.map((p) => (
                        <option key={p.pillar}>{p.pillar}</option>
                      ))}
                    </select>
                    <div
                      className="p-4 rounded-2xl text-sm space-y-1.5"
                      style={{ background: C.ivory, color: C.charcoal }}
                    >
                      <p><strong style={{ color: C.warmBlack }}>Selected:</strong> {selectedTheme}</p>
                      <p><strong style={{ color: C.warmBlack }}>Outputs:</strong> essay, carousel, reel hook, LinkedIn post (×2), Unicorn Wisdom, podcast note</p>
                    </div>
                    <Button
                      className="w-full rounded-2xl"
                      style={{ background: C.forest, color: C.bone }}
                      onClick={generateTheme}
                      disabled={themeStream.loading}
                    >
                      {themeStream.loading
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                        : <><Brain className="w-4 h-4 mr-2" /> Generate Theme Pack</>
                      }
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Newsletters ── */}
            <TabsContent value="newsletters" className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Newsletter Preference</CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>Which newsletter your audience favors most.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {newsletters.map((item) => (
                      <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.name}</span>
                          <span style={{ color: C.gold }} className="font-medium">{item.favoriteScore}</span>
                        </div>
                        <Progress
                          value={item.favoriteScore}
                          className="h-1.5"
                          style={{ background: "#DDD7CD" }}
                        />
                        <div className="text-xs flex gap-4" style={{ color: C.charcoal }}>
                          <span>Opens {item.opens}%</span>
                          <span>Clicks {item.clicks}%</span>
                          <span>Saves {item.saves}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Newsletter Intelligence</CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>What this module evaluates in real time.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm" style={{ color: C.charcoal }}>
                    {[
                      "Views, sends, opens, click-throughs, subscriber growth",
                      "Favorite issue by topic, title style, and hook",
                      "Lead generation tied to newsletter topic",
                      "Cross-over: which newsletters drive social shares",
                      "Monthly ranking of recurring series",
                      "Content recycling suggestions from top issues",
                    ].map((item) => (
                      <div key={item} className="flex gap-2 items-start">
                        <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: C.forest }} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Content Map ── */}
            <TabsContent value="content" className="space-y-4">
              {/* Real content count by platform */}
              {contentData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Total Items",  value: contentData.total },
                    { label: "Draft",        value: contentData.byStatus["draft"] ?? 0 },
                    { label: "Ready",        value: contentData.byStatus["approved"] ?? 0 },
                    { label: "Posted",       value: contentData.byStatus["posted"] ?? 0 },
                  ].map((s) => (
                    <Card key={s.label} className="rounded-2xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                      <CardContent className="p-4">
                        <p className="text-xs" style={{ color: C.charcoal }}>{s.label}</p>
                        <p className="font-serif text-2xl font-semibold mt-1">{s.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <CardTitle className="font-serif text-xl">
                        {contentData ? "Live Content Tracker" : "Monthly Topic Map"}
                      </CardTitle>
                      <CardDescription style={{ color: C.charcoal }}>
                        {contentData
                          ? `${contentData.total} items from your content tracker — real data.`
                          : "Topics for blogs, socials, newsletters, and podcast planning."}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.gold }} />
                        <Input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Filter topics…"
                          className="pl-9 rounded-2xl text-sm"
                          style={{ background: C.ivory, borderColor: "#DDD7CD" }}
                        />
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-2xl text-sm"
                        style={{ borderColor: C.gold, color: C.charcoal }}
                        onClick={buildMonth}
                        disabled={monthPlanLoading}
                      >
                        {monthPlanLoading
                          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Building…</>
                          : <><CalendarDays className="w-4 h-4 mr-2" /> Build Month</>
                        }
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {contentLoading ? (
                    <div className="flex items-center gap-2 text-sm py-4" style={{ color: C.charcoal }}>
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.forest }} />
                      Loading content tracker…
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {displayTopics.map((item) => (
                        <Card
                          key={item.id}
                          className="rounded-2xl shadow-none"
                          style={{ background: C.ivory, borderColor: "#DDD7CD" }}
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="outline"
                                className="rounded-full text-xs"
                                style={{ borderColor: C.gold, color: C.charcoal }}
                              >
                                {item.channel}
                              </Badge>
                              <span className="text-xs" style={{ color: C.charcoal }}>{item.date}</span>
                            </div>
                            <h3 className="font-medium leading-snug text-sm">{item.topic}</h3>
                            <div className="flex items-center justify-between text-xs" style={{ color: C.charcoal }}>
                              <span className="capitalize">{item.theme?.replace(/_/g, " ")}</span>
                              <span
                                className="px-2 py-0.5 rounded-full text-xs"
                                style={{
                                  background: item.status === "Draft" ? "#EDE8DF" : C.forest + "22",
                                  color: item.status === "Draft" ? C.charcoal : C.forest,
                                }}
                              >
                                {item.status}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              className="w-full rounded-xl justify-between text-xs h-8"
                              style={{ color: C.forest }}
                              onClick={() => {
                                setBlogTheme(item.topic);
                                setActiveTab("publish");
                              }}
                            >
                              Open Build Flow <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                      {displayTopics.length === 0 && !contentLoading && (
                        <p className="text-sm col-span-3 py-4" style={{ color: C.charcoal }}>
                          No items match your filter.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Content by platform bar */}
              {contentData && (
                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Content Volume by Platform</CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>From your live tracker.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={platformBarData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#DDD7CD" />
                        <XAxis dataKey="platform" tick={{ fontSize: 10, fill: C.charcoal }} />
                        <YAxis tick={{ fontSize: 11, fill: C.charcoal }} />
                        <Tooltip contentStyle={{ background: C.ivory, borderColor: "#DDD7CD", borderRadius: 12 }} />
                        <Bar dataKey="count" fill={C.sage} radius={[4, 4, 0, 0]} name="Items" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

            </TabsContent>

            {/* ── Unicorn Wisdoms ── */}
            <TabsContent value="wisdom" className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Unicorn Wisdom Bank</CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>Signature lines, sayings, and recurring wisdom content.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {defaultUnicornBank.map((line) => (
                      <div
                        key={line}
                        className="p-4 rounded-2xl border text-sm flex gap-3 items-start group"
                        style={{ borderColor: "#DDD7CD" }}
                      >
                        <MessageSquareQuote className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.gold }} />
                        <span className="font-serif italic leading-relaxed">{line}</span>
                        <button
                          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
                          style={{ color: C.charcoal }}
                          onClick={() => {
                            runWisdom("expand", `Expand: "${line.slice(0, 40)}…"`, { saying: line });
                          }}
                          title="Expand into 7 posts"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Signature Saying Builder</CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>Generate new WVW language via Claude.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div
                      className="p-4 rounded-2xl space-y-1.5 text-sm"
                      style={{ background: C.ivory, color: C.charcoal }}
                    >
                      <p><strong style={{ color: C.warmBlack }}>Use for:</strong> newsletter titles, post hooks, carousel headers, podcast segments, campaign taglines.</p>
                      <p><strong style={{ color: C.warmBlack }}>Categories:</strong> softness, standards, Black brilliance, truth-telling, rest, protection, healing, systems, leadership.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: "Generate 10 new Unicorn Wisdoms",       mode: "generate",  icon: Sparkles,   extra: { category: "softness, standards, truth-telling" } },
                        { label: "Turn a saying into 7 platform posts",   mode: "expand",    icon: RefreshCcw, extra: { saying: defaultUnicornBank[0] } },
                        { label: "Match wisdoms to audience pain points",  mode: "match",     icon: Target,     extra: {} },
                        { label: "Build 30-day Unicorn Wisdom series",    mode: "series",    icon: CalendarDays,extra: {} },
                      ].map(({ label, mode, icon: Icon, extra }) => (
                        <Button
                          key={label}
                          variant="outline"
                          className="rounded-2xl h-auto py-3 justify-start text-left text-sm"
                          style={{ borderColor: "#DDD7CD", color: C.charcoal }}
                          onClick={() => runWisdom(mode, label, extra)}
                          disabled={wisdomStream.loading}
                        >
                          <Icon className="w-4 h-4 mr-2 shrink-0" style={{ color: C.forest }} />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            {/* ── Auto-Post ── */}
            <TabsContent value="autopost" className="space-y-4">

              {/* Live connection diagnostic */}
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs"
                  style={{ borderColor: C.gold, color: C.charcoal }}
                  onClick={() => {
                    setStatusDebug("loading…");
                    fetch("/api/posting/status", { cache: "no-store" })
                      .then((r) => r.text())
                      .then((t) => setStatusDebug(t))
                      .catch((e) => setStatusDebug(`FETCH ERROR: ${String(e)}`));
                  }}
                >
                  Run Connection Diagnostic
                </Button>
                {postingStatus && <span className="text-xs" style={{ color: C.forest }}>✓ Status loaded</span>}
                {!postingStatus && !postingLoading && <span className="text-xs" style={{ color: C.rose }}>✗ Status failed to load</span>}
              </div>
              {statusDebug && (
                <pre className="text-[10px] p-3 rounded-2xl overflow-x-auto leading-relaxed" style={{ background: C.ivory, color: C.charcoal, maxHeight: "12rem" }}>
                  {statusDebug}
                </pre>
              )}

              {/* Connection status */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {postingLoading ? (
                  <div className="col-span-5 flex items-center gap-2 text-sm py-4" style={{ color: C.charcoal }}>
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.forest }} />
                    Checking connections…
                  </div>
                ) : (
                  [
                    { label: "LinkedIn Token",    key: "linkedin_token" },
                    { label: "LinkedIn Personal", key: "linkedin_person" },
                    { label: "LinkedIn WVW Page", key: "linkedin_org" },
                    { label: "X / Twitter",       key: "twitter" },
                    { label: "Bluesky",           key: "bluesky" },
                    { label: "Bluesky Personal",  key: "bluesky_personal" },
                    { label: "Facebook WVW",      key: "facebook" },
                    { label: "Instagram (Meta)",  key: "instagram" },
                    { label: "Threads",           key: "threads" },
                    { label: "TikTok (Buffer)",   key: "tiktok_buffer" },
                  ].map(({ label, key }) => {
                    const connected = postingStatus?.connections[key] ?? false;
                    return (
                      <Card key={key} className="rounded-2xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardContent className="p-4 flex items-center gap-3">
                          {connected
                            ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: C.forest }} />
                            : <AlertCircle className="w-4 h-4 shrink-0" style={{ color: C.rose }} />
                          }
                          <div>
                            <p className="text-xs font-medium">{label}</p>
                            <p className="text-xs" style={{ color: connected ? C.forest : C.rose }}>
                              {connected ? "Connected" : "Not configured"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* Today's schedule + trigger */}
                <Card className="rounded-3xl shadow-none xl:col-span-1" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Today</CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>
                      {postingStatus ? `Theme: ${postingStatus.todayTheme}` : "Loading…"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {postingStatus?.todayPlatforms.length === 0 && (
                      <p className="text-sm" style={{ color: C.charcoal }}>No platforms scheduled today.</p>
                    )}
                    {(postingStatus?.todayPlatforms ?? []).map((p) => (
                      <div
                        key={p}
                        className="flex items-center justify-between px-3 py-2.5 rounded-2xl"
                        style={{ background: C.ivory }}
                      >
                        <span className="text-sm font-medium capitalize">{p.replace(/_/g, " ")}</span>
                        <Zap className="w-3.5 h-3.5" style={{ color: C.gold }} />
                      </div>
                    ))}

                    {!postingStatus?.connections.linkedin_token && (
                      <a
                        href="/api/auth/linkedin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full rounded-2xl py-2.5 text-sm font-medium border transition-colors"
                        style={{ borderColor: C.gold, color: C.charcoal, background: C.ivory }}
                      >
                        <Link2 className="w-4 h-4" style={{ color: C.gold }} />
                        Connect LinkedIn
                      </a>
                    )}

                    <Button
                      className="w-full rounded-2xl mt-2"
                      style={{ background: C.forest, color: C.bone }}
                      onClick={triggerPosting}
                      disabled={triggering || wisdomTriggering}
                    >
                      {triggering
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting…</>
                        : <><Play className="w-4 h-4 mr-2" /> Post Today's Content Now</>
                      }
                    </Button>

                    {triggerResult && (
                      <p className="text-xs text-center pt-1" style={{ color: C.charcoal }}>
                        {triggerResult}
                      </p>
                    )}

                    <Button
                      className="w-full rounded-2xl"
                      variant="outline"
                      style={{ borderColor: C.gold, color: C.charcoal }}
                      onClick={triggerWisdom}
                      disabled={wisdomTriggering || triggering}
                    >
                      {wisdomTriggering
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending Wisdom…</>
                        : <><Sparkles className="w-4 h-4 mr-2" /> Send Unicorn Wisdom Now</>
                      }
                    </Button>

                    {wisdomResult && (
                      <p className="text-xs text-center pt-1" style={{ color: C.charcoal }}>
                        {wisdomResult}
                      </p>
                    )}

                    <div
                      className="p-3 rounded-2xl text-xs space-y-1"
                      style={{ background: C.ivory, color: C.charcoal }}
                    >
                      <p><strong style={{ color: C.warmBlack }}>Daily cron:</strong> Daily 12pm ET (17:00 UTC)</p>
                      <p><strong style={{ color: C.warmBlack }}>Wisdom cron:</strong> Daily 9am ET (14:00 UTC) · all socials</p>
                      <p><strong style={{ color: C.warmBlack }}>Newsletter cron:</strong> Mon / Wed / Fri 1pm ET (18:00 UTC)</p>
                      <p><strong style={{ color: C.warmBlack }}>Instagram:</strong> carousel posts via Meta API</p>
                      <p><strong style={{ color: C.warmBlack }}>Threads / Twitter / Facebook:</strong> posts directly</p>
                      <p><strong style={{ color: C.warmBlack }}>TikTok:</strong> queued in Buffer (not yet configured)</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent post log */}
                <Card className="rounded-3xl shadow-none xl:col-span-2" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Recent Posts</CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>Last 15 items from the post log.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(postingStatus?.recentPosts ?? []).length === 0 ? (
                      <p className="text-sm py-4" style={{ color: C.charcoal }}>
                        No posts logged yet. Click &ldquo;Post Today's Content Now&rdquo; or wait for the daily cron.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(postingStatus?.recentPosts ?? []).map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3 rounded-2xl flex items-start gap-3"
                            style={{ background: C.ivory }}
                          >
                            <span
                              className="text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5 font-medium"
                              style={{
                                background:
                                  entry.status === "posted" ? C.forest + "22"
                                  : entry.status === "queued" ? C.gold + "33"
                                  : "#DDD7CD",
                                color:
                                  entry.status === "posted" ? C.forest
                                  : entry.status === "queued" ? C.charcoal
                                  : C.rose,
                              }}
                            >
                              {entry.status}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-medium capitalize">{entry.platform.replace(/_/g, " ")}</span>
                                <span className="text-xs" style={{ color: C.charcoal }}>· {entry.theme}</span>
                              </div>
                              <p className="text-xs truncate" style={{ color: C.charcoal }}>{entry.excerpt}</p>
                            </div>
                            <span className="text-xs shrink-0" style={{ color: C.charcoal }}>
                              {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Weekly schedule grid */}
              <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                <CardHeader>
                  <CardTitle className="font-serif text-xl">Weekly Posting Schedule</CardTitle>
                  <CardDescription style={{ color: C.charcoal }}>Configure in .env.local — POST_PLATFORM_DAYS</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-6 gap-2 text-xs">
                    <div />
                    {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                      <div key={d} className="text-center font-medium" style={{ color: C.charcoal }}>{d}</div>
                    ))}
                    {Object.entries(postingStatus?.schedule ?? {}).map(([platform, days]) => (
                      <React.Fragment key={platform}>
                        <div className="font-medium capitalize pr-2" style={{ color: C.warmBlack }}>
                          {platform.replace(/_/g, " ")}
                        </div>
                        {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                          <div key={d} className="flex justify-center">
                            {(days as string[]).includes(d)
                              ? <div className="w-5 h-5 rounded-full" style={{ background: C.forest }} />
                              : <div className="w-5 h-5 rounded-full" style={{ background: "#DDD7CD" }} />
                            }
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            {/* ── Publish ── */}
            <TabsContent value="publish" className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                {/* Newsletter Generator */}
                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl flex items-center gap-2">
                      <Mail className="w-5 h-5" style={{ color: C.forest }} />
                      Newsletter Generator
                    </CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>
                      Generate a full issue and send it as a Beehiiv draft in one click.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium" style={{ color: C.charcoal }}>Series</p>
                      <div className="space-y-2">
                        {["Ease, Power, Blackness", "Black Excellence", "The Brief"].map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => { setNlSeries(s); setNlTheme(""); }}
                            className="w-full text-left px-4 py-2.5 rounded-2xl text-sm border transition-colors"
                            style={{
                              background: nlSeries === s ? C.forest : C.ivory,
                              color: nlSeries === s ? C.bone : C.charcoal,
                              borderColor: nlSeries === s ? C.forest : "#DDD7CD",
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-medium" style={{ color: C.charcoal }}>Topic</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(nlSeries === "Ease, Power, Blackness"
                          ? ["Burnout vs moral injury", "Rest as radical resistance", "Invisible labor at work", "Black joy as survival strategy", "Neurodivergent leadership", "Soft ambition and standards"]
                          : nlSeries === "Black Excellence"
                          ? ["Black women carrying emotional labor", "Black brilliance in corporate spaces", "When excellence becomes extraction", "Redefining success on our terms", "Generational healing in leadership", "Black identity and organizational power"]
                          : ["3 structural changes HR leaders need now", "The case for psychological safety", "Burnout metrics your org is ignoring", "What neurodivergent inclusion actually costs", "Fixing invisible labor in 30 days", "The rest ROI framework"]
                        ).map((topic) => (
                          <button
                            type="button"
                            key={topic}
                            onClick={() => setNlTheme(topic)}
                            className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                            style={{
                              background: nlTheme === topic ? C.forest : C.ivory,
                              color: nlTheme === topic ? C.bone : C.charcoal,
                              borderColor: nlTheme === topic ? C.forest : "#DDD7CD",
                            }}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                      <Input
                        value={nlTheme}
                        onChange={(e) => setNlTheme(e.target.value)}
                        placeholder="Or type your own topic…"
                        className="rounded-2xl text-sm"
                        style={{ background: C.ivory, borderColor: "#DDD7CD" }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-medium" style={{ color: C.charcoal }}>
                        Tone note <span style={{ color: C.gold }}>(optional)</span>
                      </p>
                      <Input
                        value={nlTone}
                        onChange={(e) => setNlTone(e.target.value)}
                        placeholder="e.g. direct, intimate, structural"
                        className="rounded-2xl text-sm"
                        style={{ background: C.ivory, borderColor: "#DDD7CD" }}
                      />
                    </div>

                    <Button
                      className="w-full rounded-2xl"
                      style={{ background: C.forest, color: C.bone }}
                      onClick={generateNewsletter}
                      disabled={nlLoading || !nlTheme.trim()}
                    >
                      {nlLoading
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                        : <><Mail className="w-4 h-4 mr-2" /> Generate + Send to Beehiiv</>
                      }
                    </Button>

                    {nlError && (
                      <p className="text-xs text-center" style={{ color: C.rose }}>{nlError}</p>
                    )}

                    {nlResult && (
                      <div className="space-y-3 pt-1">
                        <div className="p-4 rounded-2xl" style={{ background: C.ivory }}>
                          <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Subject</p>
                          <p className="text-sm font-medium">{nlResult.generated.subject}</p>
                        </div>
                        <div className="p-4 rounded-2xl" style={{ background: C.ivory }}>
                          <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Preview Text</p>
                          <p className="text-sm">{nlResult.generated.preview_text}</p>
                        </div>
                        <div
                          className="p-3 rounded-2xl text-xs flex items-center gap-2"
                          style={{
                            background: nlResult.beehiiv && !("error" in nlResult.beehiiv)
                              ? C.forest + "18"
                              : C.rose + "22",
                            color: C.charcoal,
                          }}
                        >
                          {nlResult.beehiiv && !("error" in nlResult.beehiiv)
                            ? <><CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: C.forest }} /> Draft created in Beehiiv — review and send from app.beehiiv.com</>
                            : <><AlertCircle className="w-4 h-4 shrink-0" style={{ color: C.rose }} />
                                {nlResult.beehiiv
                                  ? String(nlResult.beehiiv.error ?? "Beehiiv error")
                                  : "Add BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID to .env.local"}
                              </>
                          }
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Blog Post Generator */}
                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl flex items-center gap-2">
                      <BookOpen className="w-5 h-5" style={{ color: C.forest }} />
                      Blog Post Generator
                    </CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>
                      Generate a full post for wvwacademy.com — copy and paste into GoDaddy Website Builder.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium" style={{ color: C.charcoal }}>Theme</p>
                      <Input
                        value={blogTheme}
                        onChange={(e) => setBlogTheme(e.target.value)}
                        placeholder="e.g. Burnout vs moral injury"
                        className="rounded-2xl text-sm"
                        style={{ background: C.ivory, borderColor: "#DDD7CD" }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-medium" style={{ color: C.charcoal }}>
                        Angle <span style={{ color: C.gold }}>(optional)</span>
                      </p>
                      <Input
                        value={blogAngle}
                        onChange={(e) => setBlogAngle(e.target.value)}
                        placeholder="e.g. for HR directors making policy decisions"
                        className="rounded-2xl text-sm"
                        style={{ background: C.ivory, borderColor: "#DDD7CD" }}
                      />
                    </div>

                    <div className="p-3 rounded-2xl text-xs" style={{ background: C.ivory, color: C.charcoal }}>
                      <strong style={{ color: C.warmBlack }}>Output:</strong> 800–1200 word thought leadership post — title, meta description, full body in markdown.
                    </div>

                    <Button
                      className="w-full rounded-2xl"
                      style={{ background: C.forest, color: C.bone }}
                      onClick={generateBlog}
                      disabled={blogLoading || !blogTheme.trim()}
                    >
                      {blogLoading
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                        : <><BookOpen className="w-4 h-4 mr-2" /> Generate Blog Post</>
                      }
                    </Button>

                    {blogError && (
                      <p className="text-xs text-center" style={{ color: C.rose }}>{blogError}</p>
                    )}

                    {blogResult && (
                      <div className="space-y-3 pt-1">
                        <div className="p-4 rounded-2xl" style={{ background: C.ivory }}>
                          <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Title</p>
                          <p className="text-sm font-medium font-serif">{blogResult.title}</p>
                        </div>
                        <div className="p-4 rounded-2xl" style={{ background: C.ivory }}>
                          <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Meta Description</p>
                          <p className="text-sm">{blogResult.meta_description}</p>
                        </div>
                        <div className="p-4 rounded-2xl" style={{ background: C.ivory }}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium" style={{ color: C.charcoal }}>Blog Content</p>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(blogResult.content_markdown).catch(() => {});
                                setBlogCopied(true);
                                setTimeout(() => setBlogCopied(false), 2000);
                              }}
                              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl transition-colors"
                              style={{
                                background: blogCopied ? C.forest : "#DDD7CD",
                                color: blogCopied ? C.bone : C.charcoal,
                              }}
                            >
                              <Copy className="w-3 h-3" />
                              {blogCopied ? "Copied!" : "Copy all"}
                            </button>
                          </div>
                          <pre
                            className="text-xs leading-relaxed whitespace-pre-wrap overflow-y-auto"
                            style={{ color: C.charcoal, maxHeight: "16rem" }}
                          >
                            {blogResult.content_markdown}
                          </pre>
                        </div>
                        <div
                          className="p-3 rounded-2xl text-xs flex items-start gap-2"
                          style={{ background: C.gold + "22", color: C.charcoal }}
                        >
                          <Globe className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.gold }} />
                          <span>Copy the content above → go to GoDaddy Website Builder → add a new blog post → paste the body. Use the title and meta description for SEO fields.</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* Substack Generator — full width */}
              <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                <CardHeader>
                  <CardTitle className="font-serif text-xl flex items-center gap-2">
                    <Globe className="w-5 h-5" style={{ color: C.forest }} />
                    Substack Essay Generator
                  </CardTitle>
                  <CardDescription style={{ color: C.charcoal }}>
                    Generate a personal essay for Substack — copy title, subtitle, and body directly into the editor.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium" style={{ color: C.charcoal }}>Theme</p>
                        <Input
                          value={ssTheme}
                          onChange={(e) => setSsTheme(e.target.value)}
                          placeholder="e.g. carrying systems that were never yours"
                          className="rounded-2xl text-sm"
                          style={{ background: C.ivory, borderColor: "#DDD7CD" }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium" style={{ color: C.charcoal }}>
                          Angle <span style={{ color: C.gold }}>(optional)</span>
                        </p>
                        <Input
                          value={ssAngle}
                          onChange={(e) => setSsAngle(e.target.value)}
                          placeholder="e.g. for Black women in leadership"
                          className="rounded-2xl text-sm"
                          style={{ background: C.ivory, borderColor: "#DDD7CD" }}
                        />
                      </div>
                      <Button
                        className="w-full rounded-2xl"
                        style={{ background: C.forest, color: C.bone }}
                        onClick={generateSubstack}
                        disabled={ssLoading || !ssTheme.trim()}
                      >
                        {ssLoading
                          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                          : <><Globe className="w-4 h-4 mr-2" /> Generate Substack Essay</>
                        }
                      </Button>
                      {ssError && <p className="text-xs text-center" style={{ color: C.rose }}>{ssError}</p>}
                    </div>

                    {ssResult ? (
                      <div className="xl:col-span-2 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-4 rounded-2xl" style={{ background: C.ivory }}>
                            <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Title</p>
                            <p className="text-sm font-medium font-serif">{ssResult.title}</p>
                          </div>
                          <div className="p-4 rounded-2xl" style={{ background: C.ivory }}>
                            <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Subtitle</p>
                            <p className="text-sm italic">{ssResult.subtitle}</p>
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl" style={{ background: C.ivory }}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium" style={{ color: C.charcoal }}>Essay Body</p>
                            <button
                              onClick={() => {
                                const full = `# ${ssResult.title}\n\n*${ssResult.subtitle}*\n\n${ssResult.content_markdown}`;
                                navigator.clipboard.writeText(full).catch(() => {});
                                setSsCopied(true);
                                setTimeout(() => setSsCopied(false), 2000);
                              }}
                              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl transition-colors"
                              style={{
                                background: ssCopied ? C.forest : "#DDD7CD",
                                color: ssCopied ? C.bone : C.charcoal,
                              }}
                            >
                              <Copy className="w-3 h-3" />
                              {ssCopied ? "Copied!" : "Copy all"}
                            </button>
                          </div>
                          <pre className="text-xs leading-relaxed whitespace-pre-wrap overflow-y-auto" style={{ color: C.charcoal, maxHeight: "16rem" }}>
                            {ssResult.content_markdown}
                          </pre>
                        </div>
                        <div className="p-3 rounded-2xl text-xs flex items-start gap-2" style={{ background: C.gold + "22", color: C.charcoal }}>
                          <Globe className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.gold }} />
                          <span>Go to substack.com → New Post → paste the title, subtitle, and body. The essay is formatted in markdown, which Substack renders automatically.</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="xl:col-span-2 flex items-center justify-center rounded-2xl p-8 text-sm"
                        style={{ background: C.ivory, color: C.charcoal }}
                      >
                        Your generated essay will appear here.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            {/* ── Calendar ── */}
            <TabsContent value="calendar" className="space-y-4">
              <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-serif text-xl">Post Calendar</CardTitle>
                      <CardDescription style={{ color: C.charcoal }}>Every post logged across all platforms, by date.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const today = new Date();
                          setCalYear(today.getFullYear());
                          setCalMonth(today.getMonth() + 1);
                          setCalSelected(null);
                        }}
                        className="text-xs px-2.5 py-1 rounded-xl transition-colors"
                        style={{ background: C.ivory, color: C.charcoal, border: `1px solid #DDD7CD` }}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => {
                          const d = new Date(calYear, calMonth - 2, 1);
                          setCalYear(d.getFullYear());
                          setCalMonth(d.getMonth() + 1);
                          setCalSelected(null);
                        }}
                        className="p-2 rounded-xl hover:opacity-70 transition-opacity"
                        style={{ background: C.ivory }}
                      >
                        <ChevronLeft className="w-4 h-4" style={{ color: C.charcoal }} />
                      </button>
                      <span className="text-sm font-medium px-2" style={{ color: C.warmBlack }}>
                        {new Date(calYear, calMonth - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </span>
                      <button
                        onClick={() => {
                          const d = new Date(calYear, calMonth, 1);
                          setCalYear(d.getFullYear());
                          setCalMonth(d.getMonth() + 1);
                          setCalSelected(null);
                        }}
                        className="p-2 rounded-xl hover:opacity-70 transition-opacity"
                        style={{ background: C.ivory }}
                      >
                        <ChevronRight className="w-4 h-4" style={{ color: C.charcoal }} />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {calLoading ? (
                    <div className="flex items-center gap-2 py-12 justify-center" style={{ color: C.charcoal }}>
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.forest }} />
                      Loading calendar…
                    </div>
                  ) : (() => {
                    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
                    const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
                    const byDate: Record<string, typeof calEntries> = {};
                    calEntries.forEach((e) => {
                      if (!byDate[e.date]) byDate[e.date] = [];
                      byDate[e.date].push(e);
                    });
                    const PLATFORM_COLORS: Record<string, string> = {
                      linkedin_personal: "#0A66C2",
                      linkedin_wvw: "#0A66C2",
                      facebook: "#1877F2",
                      instagram: "#E1306C",
                      threads: "#6E5DE0",
                      bluesky: "#0085FF",
                      bluesky_personal: "#0085FF",
                      twitter: "#1DA1F2",
                      tiktok: "#FF0050",
                    };
                    const cells: (number | null)[] = [
                      ...Array(firstDow).fill(null),
                      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                    ];
                    const selectedEntries = calSelected ? (byDate[calSelected] ?? []) : [];

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-7 gap-1">
                          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                            <div key={d} className="text-center text-xs font-medium pb-2" style={{ color: C.charcoal }}>{d}</div>
                          ))}
                          {cells.map((day, idx) => {
                            if (!day) return <div key={`empty-${idx}`} />;
                            const dateStr = `${calYear}-${String(calMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                            const entries = byDate[dateStr] ?? [];
                            const isSelected = calSelected === dateStr;
                            const isToday = dateStr === new Date().toISOString().slice(0,10);
                            return (
                              <button
                                key={day}
                                onClick={() => setCalSelected(isSelected ? null : dateStr)}
                                className="rounded-2xl p-2 flex flex-col items-center gap-1 min-h-[52px] transition-colors"
                                style={{
                                  background: isSelected ? C.forest : isToday ? C.gold + "33" : C.ivory,
                                  border: `1px solid ${isSelected ? C.forest : isToday ? C.gold : "#DDD7CD"}`,
                                }}
                              >
                                <span className="text-xs font-medium" style={{ color: isSelected ? C.bone : C.warmBlack }}>
                                  {day}
                                </span>
                                {entries.length > 0 && (
                                  <div className="flex flex-wrap gap-0.5 justify-center">
                                    {entries.slice(0, 4).map((e, i) => (
                                      <div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ background: PLATFORM_COLORS[e.platform] ?? C.charcoal }}
                                        title={e.platform}
                                      />
                                    ))}
                                    {entries.length > 4 && (
                                      <span className="text-[8px]" style={{ color: isSelected ? C.bone : C.charcoal }}>+{entries.length - 4}</span>
                                    )}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {calSelected && (
                          <div className="rounded-2xl p-4 space-y-3" style={{ background: C.ivory, border: `1px solid #DDD7CD` }}>
                            <p className="text-sm font-medium" style={{ color: C.warmBlack }}>
                              {new Date(calSelected + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                            </p>
                            {selectedEntries.length === 0 ? (
                              <p className="text-sm" style={{ color: C.charcoal }}>No posts logged for this day.</p>
                            ) : (
                              <div className="space-y-2">
                                {selectedEntries.map((e) => (
                                  <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: C.bone }}>
                                    <div
                                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                                      style={{ background: PLATFORM_COLORS[e.platform] ?? C.charcoal }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="text-xs font-medium" style={{ color: C.charcoal }}>{e.platform}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.gold + "33", color: C.charcoal }}>{e.theme}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: e.status === "posted" ? C.forest + "22" : C.rose + "33", color: e.status === "posted" ? C.forest : C.charcoal }}>{e.status}</span>
                                      </div>
                                      {e.excerpt && <p className="text-xs" style={{ color: C.charcoal }}>{e.excerpt}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {calEntries.length === 0 && !calSelected && (
                          <p className="text-sm text-center py-4" style={{ color: C.charcoal }}>
                            No posts logged this month yet. Posts appear here automatically after each cron run.
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 pt-2">
                          {Object.entries({
                            "LinkedIn": "#0A66C2",
                            "Facebook": "#1877F2",
                            "Instagram": "#E1306C",
                            "Threads": "#6E5DE0",
                            "Bluesky": "#0085FF",
                            "Twitter": "#1DA1F2",
                          }).map(([label, color]) => (
                            <div key={label} className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                              <span className="text-xs" style={{ color: C.charcoal }}>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Performance ── */}
            <TabsContent value="performance" className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: C.gold + "33", color: C.charcoal }}>Illustrative data — replace with your real post analytics</span>
              </div>
              <ContentPerformanceTable posts={samplePosts} />
            </TabsContent>

            {/* ── Intelligence ── */}
            <TabsContent value="intelligence" className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: C.gold + "33", color: C.charcoal }}>Illustrative data — replace with your real post analytics</span>
              </div>
              <AIInsightsPanel posts={samplePosts} />
            </TabsContent>

            {/* ── Audience ── */}
            <TabsContent value="audience" className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: C.gold + "33", color: C.charcoal }}>Illustrative data — these are example audience segments, not your real followers</span>
              </div>
              <AudienceInsights insights={sampleAudience} />
            </TabsContent>

            {/* ── Community ── */}
            <TabsContent value="community" className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: C.gold + "33", color: C.charcoal }}>Illustrative data — log real DMs and comments here to track actual leads</span>
              </div>
              <CommunityLeads interactions={sampleInteractions} />
            </TabsContent>

            {/* ── Conversions ── */}
            <TabsContent value="conversions" className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: C.gold + "33", color: C.charcoal }}>Illustrative data — log real discovery calls and client conversions here</span>
              </div>
              <ConversionEngine conversions={sampleConversions} />
            </TabsContent>

            {/* ── Experiments ── */}
            <TabsContent value="experiments" className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: C.gold + "33", color: C.charcoal }}>Illustrative data — log real content experiments and outcomes here</span>
              </div>
              <ExperimentBoard experiments={sampleExperiments} />
            </TabsContent>

            {/* ── Repurpose ── */}
            <TabsContent value="repurpose" className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: C.gold + "33", color: C.charcoal }}>Illustrative data — based on example posts, not your live analytics</span>
              </div>
              <RepurposingEngine posts={samplePosts} />
            </TabsContent>

            {/* ── Reports ── */}
            <TabsContent value="reports" className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: C.gold + "33", color: C.charcoal }}>Illustrative data — reports will reflect real numbers once analytics are connected</span>
              </div>
              <ReportsSection posts={samplePosts} conversions={sampleConversions} interactions={sampleInteractions} />
            </TabsContent>

            {/* ── Settings ── */}
            <TabsContent value="settings" className="space-y-4">
              {/* Platform connection status */}
              <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                <CardHeader>
                  <CardTitle className="font-serif text-xl">Platform Connections</CardTitle>
                  <CardDescription style={{ color: C.charcoal }}>
                    All credentials live in Vercel → Settings → Environment Variables. Hard-refresh after adding any new variable.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      platform: "LinkedIn Personal + WVW",
                      keys: ["LINKEDIN_ACCESS_TOKEN", "LINKEDIN_PERSON_URN", "LINKEDIN_ORG_URN"],
                      postStatus: postingStatus?.connections.linkedin_token && postingStatus?.connections.linkedin_person,
                      note: "Token expires every 60 days — re-auth at /api/auth/linkedin",
                      analyticsNote: "Add r_organization_social scope to pull live follower + engagement data",
                    },
                    {
                      platform: "Bluesky WVW + Personal",
                      keys: ["BLUESKY_IDENTIFIER", "BLUESKY_APP_PASSWORD", "BLUESKY_PERSONAL_IDENTIFIER", "BLUESKY_PERSONAL_APP_PASSWORD"],
                      postStatus: postingStatus?.connections.bluesky && postingStatus?.connections.bluesky_personal,
                      note: "App passwords never expire — generate at bsky.app → Settings → App Passwords",
                      analyticsNote: "No analytics API yet — Bluesky protocol still building this",
                    },
                    {
                      platform: "Facebook WVW Page",
                      keys: ["FACEBOOK_PAGE_ACCESS_TOKEN", "FACEBOOK_PAGE_ID"],
                      postStatus: postingStatus?.connections.facebook,
                      note: "Long-lived token (60 days) — renew via Meta Graph API Explorer",
                      analyticsNote: "Add pages_read_engagement scope to pull reach + follower data",
                    },
                    {
                      platform: "Instagram Business",
                      keys: ["INSTAGRAM_BUSINESS_ACCOUNT_ID"],
                      postStatus: postingStatus?.connections.instagram,
                      note: "Uses same FACEBOOK_PAGE_ACCESS_TOKEN — account must be Business type",
                      analyticsNote: "Add instagram_manage_insights scope for impressions + reach",
                    },
                    {
                      platform: "Threads",
                      keys: ["THREADS_ACCESS_TOKEN", "THREADS_USER_ID"],
                      postStatus: postingStatus?.connections.threads,
                      note: "Generate via developers.facebook.com → your Threads app",
                      analyticsNote: "Add threads_manage_insights scope for Threads analytics",
                    },
                    {
                      platform: "Twitter / X",
                      keys: ["TWITTER_API_KEY", "TWITTER_API_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_SECRET"],
                      postStatus: postingStatus?.connections.twitter,
                      note: "OAuth 1.0a — generate at developer.twitter.com → Your App → Keys and Tokens",
                      analyticsNote: "Free tier: tweet metrics only. Basic tier ($100/mo): full analytics",
                    },
                    {
                      platform: "TikTok (via Buffer)",
                      keys: ["BUFFER_ACCESS_TOKEN", "BUFFER_PROFILE_TIKTOK"],
                      postStatus: postingStatus?.connections.tiktok_buffer,
                      note: "Connect TikTok to Buffer → get API token at buffer.com/developers",
                      analyticsNote: "TikTok analytics available via TikTok Business API (separate setup)",
                    },
                    {
                      platform: "Supabase (post log + calendar + blog)",
                      keys: ["SUPABASE_URL", "SUPABASE_ANON_KEY"],
                      postStatus: !!(postingStatus?.recentPosts !== undefined),
                      note: "Project: xsrcvtpbrhuiymxyxwkf — get keys at supabase.com → project → Settings → API",
                      analyticsNote: "Required for calendar, recent post log, and blog publishing to work",
                    },
                  ].map((item) => (
                    <div key={item.platform} className="p-4 rounded-2xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          {item.postStatus
                            ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: C.forest }} />
                            : <AlertCircle className="w-4 h-4 shrink-0" style={{ color: C.rose }} />
                          }
                          <span className="font-medium text-sm">{item.platform}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{
                          background: item.postStatus ? C.forest + "22" : C.rose + "22",
                          color: item.postStatus ? C.forest : C.rose,
                        }}>
                          {item.postStatus ? "Connected" : "Not configured"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {item.keys.map((k) => (
                            <code key={k} className="text-[10px] px-2 py-0.5 rounded-lg font-mono" style={{ background: C.bone, color: C.charcoal }}>
                              {k}
                            </code>
                          ))}
                        </div>
                        <p className="text-xs" style={{ color: C.charcoal }}>{item.note}</p>
                        <p className="text-xs italic" style={{ color: C.sage }}>Analytics: {item.analyticsNote}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Cron schedule */}
              <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                <CardHeader>
                  <CardTitle className="font-serif text-xl">Cron Schedule</CardTitle>
                  <CardDescription style={{ color: C.charcoal }}>Configured in vercel.json — all times UTC.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { name: "Unicorn Wisdom", schedule: "Daily 9am ET (14:00 UTC)", path: "/api/cron/wisdom", note: "Posts to all 6 connected socials" },
                    { name: "Daily Content",  schedule: "Daily 12pm ET (17:00 UTC)", path: "/api/cron/daily", note: "Posts platform-specific content based on schedule" },
                    { name: "Newsletter",     schedule: "Mon / Wed / Fri 1pm ET (18:00 UTC)", path: "/api/cron/newsletter", note: "Sends Beehiiv draft if configured" },
                  ].map((cron) => (
                    <div key={cron.name} className="flex items-start justify-between p-3 rounded-2xl gap-4" style={{ background: C.ivory }}>
                      <div>
                        <p className="text-sm font-medium">{cron.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: C.charcoal }}>{cron.note}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium" style={{ color: C.forest }}>{cron.schedule}</p>
                        <code className="text-[10px] font-mono" style={{ color: C.charcoal }}>{cron.path}</code>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Posting schedule */}
              <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                <CardHeader>
                  <CardTitle className="font-serif text-xl">What Goes Live When Analytics Are Connected</CardTitle>
                  <CardDescription style={{ color: C.charcoal }}>These dashboard sections will show real data once the scopes below are added to each platform token.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm" style={{ color: C.charcoal }}>
                  {[
                    { section: "KPI Row (Audience, Engagement)", what: "LinkedIn + Instagram follower count, cross-platform avg engagement" },
                    { section: "Socials → Platform Performance table", what: "Live follower count, reach, CTR per platform" },
                    { section: "Overview → Growth Trend chart", what: "Real month-by-month engagement and lead tracking" },
                    { section: "Performance + Intelligence tabs", what: "Actual post-level analytics replacing sample data" },
                    { section: "Calendar", what: "Already live once SUPABASE_URL and SUPABASE_ANON_KEY are in Vercel" },
                    { section: "Recent Posts log", what: "Already live once SUPABASE_URL and SUPABASE_ANON_KEY are in Vercel" },
                  ].map((row) => (
                    <div key={row.section} className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: C.ivory }}>
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: C.gold }} />
                      <div>
                        <p className="font-medium text-xs" style={{ color: C.warmBlack }}>{row.section}</p>
                        <p className="text-xs">{row.what}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

          {/* ── Bottom integrations row ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { icon: Link2,        title: "Live Integrations",  text: "Meta, LinkedIn, TikTok, Reddit, newsletter tools, CRM, scheduler" },
              { icon: FolderKanban, title: "Workflow Routing",   text: "Idea → approve → publish → analyze → repurpose" },
              { icon: Target,       title: "Lead Attribution",   text: "Know which content themes bring consultations and inquiries" },
              { icon: Lightbulb,    title: "Strategy Alerts",    text: "Get notified when a topic spikes or a pillar underperforms" },
            ].map((card) => (
              <Card key={card.title} className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                <CardContent className="p-5 space-y-3">
                  <div className="p-3 rounded-2xl w-fit" style={{ background: C.ivory }}>
                    <card.icon className="w-4 h-4" style={{ color: C.forest }} />
                  </div>
                  <h3 className="font-serif text-base font-semibold">{card.title}</h3>
                  <p className="text-sm" style={{ color: C.charcoal }}>{card.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── CTA banner ── */}
          <Card
            className="rounded-3xl overflow-hidden"
            style={{ background: C.forest, border: "none" }}
          >
            <CardContent className="p-6 md:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: C.gold }}>Next build layer</p>
                <h2 className="font-serif text-2xl md:text-3xl font-semibold" style={{ color: C.bone }}>
                  Wire this prototype to real platform APIs and auto-publishing.
                </h2>
                <p className="mt-2 max-w-2xl text-sm" style={{ color: C.bone + "cc" }}>
                  Connect Meta, LinkedIn, and TikTok APIs with a scheduler, a CRM, and background jobs so every signal here becomes a live action — not a prompt.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Button
                  className="rounded-2xl"
                  style={{ background: C.gold, color: C.warmBlack }}
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Connect Data
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  style={{ borderColor: C.bone + "66", color: C.bone }}
                >
                  <BarChart3 className="w-4 h-4 mr-2" /> Build Backend
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
}
