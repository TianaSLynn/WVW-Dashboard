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
  Eye,
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
  Plus,
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
import WebsiteAnalytics       from "@/components/dashboard/WebsiteAnalytics";
import NewsletterAnalytics    from "@/components/dashboard/NewsletterAnalytics";
import AssessmentResults      from "@/components/dashboard/AssessmentResults";
import { samplePosts, sampleAudience, sampleConversions, sampleExperiments } from "@/data/sampleData";
import type { CommunityInteraction } from "@/types/dashboard";
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

// ─── Emil Kowalski spring physics system ─────────────────────────
const SPRING = { type: "spring", stiffness: 320, damping: 28 } as const;
const SPRING_SLOW = { type: "spring", stiffness: 200, damping: 30 } as const;
const FADE_BLUR = { initial: { opacity: 0, filter: "blur(8px)", y: 6 }, animate: { opacity: 1, filter: "blur(0px)", y: 0 }, exit: { opacity: 0, filter: "blur(4px)", y: -4 }, transition: SPRING };
const STAGGER = (i: number) => ({ ...SPRING, delay: i * 0.055 });
const cardHover = { whileHover: { y: -3, boxShadow: "0 12px 32px rgba(28,58,42,0.10)" }, transition: SPRING };
const btnTap = { whileTap: { scale: 0.94 }, transition: SPRING };

// ─── Brand colours (Notion-light + WVW accents) ───────────────────
const C = {
  forest:    "#1C3A2A",
  warmBlack: "#37352F",
  bone:      "#F7F7F5",
  rose:      "#C4A09A",
  gold:      "#B8A06A",
  charcoal:  "#787774",
  sage:      "#4A5E4F",
  ivory:     "#FFFFFF",
};
const N = {
  bg:      "#FFFFFF",
  sidebar: "#F7F7F5",
  hover:   "rgba(55,53,47,0.06)",
  active:  "rgba(55,53,47,0.10)",
  border:  "rgba(55,53,47,0.09)",
  text:    "#37352F",
  muted:   "#787774",
};

// ─── Static reference data ────────────────────────────────────────
const socialSummary = [
  { platform: "LinkedIn Personal", followers: 4281, engagement: 6.8, ctr: 4.1, posts: 11, leadScore: 82 },
  { platform: "LinkedIn WVW",      followers: 1905, engagement: 5.2, ctr: 3.7, posts: 8,  leadScore: 76 },
  { platform: "Instagram",         followers: 3210, engagement: 7.3, ctr: 2.8, posts: 14, leadScore: 64 },
  { platform: "TikTok",            followers: 2640, engagement: 8.9, ctr: 1.9, posts: 9,  leadScore: 58 },
  { platform: "Threads",           followers: 1112, engagement: 4.9, ctr: 2.1, posts: 7,  leadScore: 51 },
  { platform: "Facebook",          followers: 1630, engagement: 3.1, ctr: 1.4, posts: 6,  leadScore: 42 },
  { platform: "Bluesky",           followers: 930,  engagement: 6.1, ctr: 1.8, posts: 63, leadScore: 65 },
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
  error_detail?: string;
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

// ─── Sidebar nav item ─────────────────────────────────────────────
function SidebarItem({ emoji, label, active, onClick }: { emoji: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 3, backgroundColor: active ? N.active : N.hover }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left relative overflow-hidden"
      style={{
        background: active ? N.active : "transparent",
        color: active ? N.text : N.muted,
        fontWeight: active ? 600 : 400,
      }}
    >
      {active && (
        <motion.div
          layoutId="sidebarActive"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
          style={{ background: "#1C3A2A" }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        />
      )}
      <span className="text-base leading-none">{emoji}</span>
      <span className="truncate">{label}</span>
    </motion.button>
  );
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

// ─── Celebration burst overlay ────────────────────────────────────
function CelebrationBurst({ message, onDone }: { message: string; onDone: () => void }) {
  React.useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  const particles = ["✨","🌟","💜","🎉","👑","🌿","💫","🙌🏾","🔥","⭐","💜","✨","🌸","🎊","💎","🦄","🌈","💐"];
  return (
    <motion.div className="fixed inset-0 z-[300] pointer-events-none flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {particles.map((e, i) => {
        const angle = (i / particles.length) * 360;
        const dist = 140 + (i % 4) * 55;
        const x = Math.cos((angle * Math.PI) / 180) * dist;
        const y = Math.sin((angle * Math.PI) / 180) * dist;
        return (
          <motion.span key={i} className="absolute text-4xl select-none"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
            animate={{ x, y, opacity: [1, 1, 0], scale: [0, 1.6, 1], rotate: [0, 25, -15] }}
            transition={{ type: "spring", stiffness: 280, damping: 20, delay: i * 0.035 }}>
            {e}
          </motion.span>
        );
      })}
      <motion.div
        className="px-10 py-6 rounded-3xl text-center shadow-2xl z-10 border"
        style={{ background: "linear-gradient(135deg, #1C3A2A, #2D5A40)", color: "#F5F0E8", borderColor: "#B8A06A44" }}
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: [0, 1.1, 0.97, 1], opacity: [0, 1, 1, 1, 0], y: [20, 0, 0, 0, -10] }}
        transition={{ duration: 2.8, times: [0, 0.2, 0.5, 0.75, 1] }}>
        <motion.p
          className="font-serif text-2xl font-semibold"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ repeat: 2, duration: 0.6, ease: "easeInOut" }}
        >{message}</motion.p>
      </motion.div>
    </motion.div>
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
  const [beTriggering, setBeTriggering] = useState(false);
  const [beResult, setBeResult] = useState<string | null>(null);
  const [bskySlotTriggering, setBskySlotTriggering] = useState<number | null>(null);
  const [bskySlotResults, setBskySlotResults] = useState<Record<number, string>>({});
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

  // ── Publish tab state ──
  const [nlSeries, setNlSeries] = useState("Ease, Power, Blackness");
  const [nlTheme, setNlTheme] = useState("");
  const [nlTone, setNlTone] = useState("");
  const [blogTheme, setBlogTheme] = useState("");
  const [blogAngle, setBlogAngle] = useState("");

  // ── Content queue ──
  type QueueItem = { id: string; platform: string; theme: string; text: string; status: string; created_at: string };
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [editingQueue, setEditingQueue] = useState<Record<string, string>>({});
  const [queuePosting, setQueuePosting] = useState<Record<string, boolean>>({});
  const [generatingToQueue, setGeneratingToQueue] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [queueGenResult, setQueueGenResult] = useState<string | null>(null);
  const [alertGenerating, setAlertGenerating] = useState<Record<number, boolean>>({});
  const [alertGenResult, setAlertGenResult] = useState<Record<number, string>>({});

  // ── Cron activity banner ──
  const [cronBanner, setCronBanner] = useState<{ posted: number; failed: number; label: string; since: string } | null>(null);

  // ── Life OS ──
  type Habit = { id: string; name: string; emoji: string; category: string; sort_order: number };
  type HabitLog = { id: string; habit_id: string; logged_date: string };
  type Task = { id: string; title: string; priority: string; category: string; status: string; due_date?: string; notes?: string; completed_at?: string };
  type WeekPlan = { week_start: string; main_focus: string; goals: string[]; word_of_week: string; intentions: string };
  type TodayIntention = { id?: string; date: string; top3?: string[]; energy_level?: number; nervous_system?: string; morning_note?: string; evening_note?: string; gratitude?: string[]; wins?: string[]; brain_dump?: string; one_thing?: string; social_battery?: number; mood?: string; recharge?: string; alignment_note?: string };
  type RecentIntention = { date: string; energy_level?: number; nervous_system?: string; mood?: string; social_battery?: number };
  type Book = { id: string; title: string; author?: string; status: string; genre?: string; started_at?: string; completed_at?: string; rating?: number; cover_url?: string; media_type?: string; notes?: string };
  type BucketItem = { id: string; title: string; category: string; notes?: string; completed: boolean; completed_at?: string };
  type WaterLog = { id: string; date: string; cups: number; goal_cups: number };
  type Medication = { id: string; name: string; dose?: string; frequency: string; active: boolean; sort_order: number; when_to_take?: string; symptoms_to_track?: string[]; notes?: string };
  type MedLog = { id: string; date: string; medication_name: string; taken: boolean; taken_at?: string; symptoms: string[]; notes?: string };
  type SpiritSign = { id: string; category: string; name: string; meaning: string; hoodoo_context?: string; personal_notes?: string; is_reference: boolean };
  type SleepLog = { id: string; date: string; hours?: number; quality?: number; notes?: string; bedtime?: string; wake_time?: string };
  type MonthlyReview = { id?: string; month: string; word_of_month?: string; top_goals?: string[]; goals_completed?: boolean[]; big_wins?: string[]; growth_areas?: string[]; grateful_for?: string[]; reflection?: string };
  type QuarterlyReview = { id?: string; quarter: string; year: number; quarter_num: number; revenue_target?: number; revenue_actual?: number; new_clients?: number; leads_generated?: number; savings_target?: number; savings_actual?: number; quarterly_goals?: string[]; goals_status?: string[]; what_worked?: string; what_to_change?: string; next_quarter_focus?: string; personal_reflection?: string; relationships_reflection?: string; wellbeing_reflection?: string; alignment_score?: number };
  type AnnualReview = { id?: string; year: number; word_of_year?: string; vision_statement?: string; focus_buckets?: Array<{ label: string; description: string; wins: string; grow: string }>; reset_q1?: string; reset_q2?: string; reset_q3?: string; reset_q4?: string; big_wins?: string[]; releasing?: string[]; calling_in?: string[] };
  type LifeData = { habits: Habit[]; habitLogs: HabitLog[]; habitLogsMonth: HabitLog[]; tasks: Task[]; weekPlan: WeekPlan | null; todayIntention: TodayIntention | null; books: Book[]; bucketList: BucketItem[]; waterLog: WaterLog | null; medications: Medication[]; medLogs: MedLog[]; spiritSigns: SpiritSign[]; sleepLog: SleepLog | null; monthlyReview: MonthlyReview | null; quarterlyReview: QuarterlyReview | null; annualReview: AnnualReview | null; recentIntentions: RecentIntention[]; today: string; weekStart: string; monthStart: string; currentMonth: string; currentQuarter: string; currentYear: number };

  const [lifeData, setLifeData] = useState<LifeData | null>(null);
  const [lifeLoading, setLifeLoading] = useState(false);
  const [lifeTab, setLifeTab] = useState<"today"|"habits"|"tasks"|"weekly"|"monthly"|"quarterly"|"annual"|"library"|"bucket"|"wellness"|"spiritual">("today");
  const [newTask, setNewTask] = useState({ title: "", priority: "medium", category: "personal", due_date: "" });
  const [addingTask, setAddingTask] = useState(false);
  const [newBook, setNewBook] = useState({ title: "", author: "", genre: "", cover_url: "", media_type: "book" });
  const [addingBook, setAddingBook] = useState(false);
  const [newBucket, setNewBucket] = useState({ title: "", category: "experience" });
  const [addingBucket, setAddingBucket] = useState(false);
  const [weekEdit, setWeekEdit] = useState(false);
  const [weekDraft, setWeekDraft] = useState({ main_focus: "", goals: ["","","",""], word_of_week: "", intentions: "" });
  const [intentionEdit, setIntentionEdit] = useState(false);
  const [intentionDraft, setIntentionDraft] = useState({ top3: ["","",""], energy_level: 3, nervous_system: "regulated", morning_note: "", evening_note: "", gratitude: ["","",""], social_battery: 3, mood: "", recharge: "", alignment_note: "", one_thing: "" });
  const [oneThing, setOneThing] = useState("");
  const [oneThingSaved, setOneThingSaved] = useState(false);
  const oneThingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [habitJustLogged, setHabitJustLogged] = useState<Set<string>>(new Set());
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  // Monthly / Quarterly / Annual review drafts
  const [monthDraft, setMonthDraft] = useState({ word_of_month: "", top_goals: ["","",""], goals_completed: [false,false,false], big_wins: ["",""], growth_areas: ["",""], grateful_for: ["",""], reflection: "" });
  const [monthSaved, setMonthSaved] = useState(false);
  const [quarterDraft, setQuarterDraft] = useState({ revenue_target: "", revenue_actual: "", new_clients: "", leads_generated: "", savings_target: "", savings_actual: "", quarterly_goals: ["","",""], goals_status: ["","",""], what_worked: "", what_to_change: "", next_quarter_focus: "", personal_reflection: "", relationships_reflection: "", wellbeing_reflection: "", alignment_score: 0 });
  const [quarterSaved, setQuarterSaved] = useState(false);
  const [annualDraft, setAnnualDraft] = useState({ word_of_year: "", vision_statement: "", focus_buckets: [{ label: "Business", description: "", wins: "", grow: "" }, { label: "Health", description: "", wins: "", grow: "" }, { label: "Relationships", description: "", wins: "", grow: "" }, { label: "Personal Growth", description: "", wins: "", grow: "" }], reset_q1: "", reset_q2: "", reset_q3: "", reset_q4: "", big_wins: ["","",""], releasing: ["",""], calling_in: ["",""] });
  const [annualSaved, setAnnualSaved] = useState(false);
  // Wellness state
  const [waterCups, setWaterCups] = useState(0);
  const [waterGoal] = useState(8);
  const [spiritCategory, setSpiritCategory] = useState("All");
  const [spiritSearch, setSpiritSearch] = useState("");
  const [spiritExpanded, setSpiritExpanded] = useState<string | null>(null);
  const [newSign, setNewSign] = useState({ category: "Omens", name: "", meaning: "", hoodoo_context: "", personal_notes: "" });
  const [addingSign, setAddingSign] = useState(false);
  const [libFilter, setLibFilter] = useState<"all"|"book"|"audiobook"|"album">("all");
  const [libStatus, setLibStatus] = useState<"all"|"reading"|"completed"|"want_to_read">("all");
  // Sleep
  const [sleepDraft, setSleepDraft] = useState({ hours: "", quality: 0, bedtime: "", wake_time: "", notes: "" });
  const [sleepSaved, setSleepSaved] = useState(false);
  // Medication autocomplete
  type MedInfo = { normalizedName: string; commonBrands: string[]; commonDoses: string[]; whenToTake: string; frequency: string; symptomsToTrack: string[]; notes: string; found: boolean };
  const [medSearchQuery, setMedSearchQuery] = useState("");
  const [medSearchResult, setMedSearchResult] = useState<MedInfo | null>(null);
  const [medSearchLoading, setMedSearchLoading] = useState(false);
  const [newMedForm, setNewMedForm] = useState({ name: "", dose: "", frequency: "daily", when_to_take: "", symptoms_to_track: [] as string[], notes: "" });
  const [addingMedFull, setAddingMedFull] = useState(false);
  const medSearchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lifeSaveError, setLifeSaveError] = useState<string | null>(null);
  const [smsSending, setSmsSending] = useState(false);
  const [smsLastSent, setSmsLastSent] = useState<string | null>(null);
  const [smsPreview, setSmsPreview] = useState<string | null>(null);
  const [eveningSending, setEveningSending] = useState(false);
  const [eveningPreview, setEveningPreview] = useState<string | null>(null);
  // Focus timer (Pomodoro)
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [focusActive, setFocusActive] = useState(false);
  const [focusMode, setFocusMode] = useState<"work"|"break">("work");
  const focusInterval = React.useRef<ReturnType<typeof setInterval> | null>(null);
  // Brain dump
  const [brainDump, setBrainDump] = useState("");
  const [brainDumpSaved, setBrainDumpSaved] = useState(false);
  const brainDumpTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Celebration
  const [celebration, setCelebration] = useState<{ message: string; show: boolean }>({ message: "", show: false });
  const triggerCelebration = React.useCallback((message: string) => {
    setCelebration({ message, show: true });
    setTimeout(() => setCelebration((s) => ({ ...s, show: false })), 2800);
  }, []);

  const loadLifeData = React.useCallback(() => {
    setLifeLoading(true);
    fetch("/api/life")
      .then((r) => r.json())
      .then((d: LifeData) => {
        setLifeData(d);
        setWaterCups(d.waterLog?.cups ?? 0);
        setWeekDraft({ main_focus: d.weekPlan?.main_focus ?? "", goals: [...(d.weekPlan?.goals ?? ["","","",""]), "","","",""].slice(0,4), word_of_week: d.weekPlan?.word_of_week ?? "", intentions: d.weekPlan?.intentions ?? "" });
        setIntentionDraft({ top3: [...(d.todayIntention?.top3 ?? ["","",""]), "","",""].slice(0,3), energy_level: d.todayIntention?.energy_level ?? 3, nervous_system: d.todayIntention?.nervous_system ?? "regulated", morning_note: d.todayIntention?.morning_note ?? "", evening_note: d.todayIntention?.evening_note ?? "", gratitude: [...(d.todayIntention?.gratitude ?? ["","",""]), "","",""].slice(0,3), social_battery: d.todayIntention?.social_battery ?? 3, mood: d.todayIntention?.mood ?? "", recharge: d.todayIntention?.recharge ?? "", alignment_note: d.todayIntention?.alignment_note ?? "", one_thing: d.todayIntention?.one_thing ?? "" });
        if (d.todayIntention?.one_thing) setOneThing(d.todayIntention.one_thing);
        if (d.sleepLog) setSleepDraft({ hours: String(d.sleepLog.hours ?? ""), quality: d.sleepLog.quality ?? 0, bedtime: d.sleepLog.bedtime ?? "", wake_time: d.sleepLog.wake_time ?? "", notes: d.sleepLog.notes ?? "" });
        if (d.todayIntention?.brain_dump) setBrainDump(d.todayIntention.brain_dump);
        if (d.monthlyReview) setMonthDraft({ word_of_month: d.monthlyReview.word_of_month ?? "", top_goals: [...(d.monthlyReview.top_goals ?? ["","",""]), "","",""].slice(0,3), goals_completed: [...(d.monthlyReview.goals_completed ?? [false,false,false]), false,false,false].slice(0,3), big_wins: [...(d.monthlyReview.big_wins ?? ["",""]), "",""].slice(0,2), growth_areas: [...(d.monthlyReview.growth_areas ?? ["",""]), "",""].slice(0,2), grateful_for: [...(d.monthlyReview.grateful_for ?? ["",""]), "",""].slice(0,2), reflection: d.monthlyReview.reflection ?? "" });
        if (d.quarterlyReview) setQuarterDraft({ revenue_target: String(d.quarterlyReview.revenue_target ?? ""), revenue_actual: String(d.quarterlyReview.revenue_actual ?? ""), new_clients: String(d.quarterlyReview.new_clients ?? ""), leads_generated: String(d.quarterlyReview.leads_generated ?? ""), savings_target: String(d.quarterlyReview.savings_target ?? ""), savings_actual: String(d.quarterlyReview.savings_actual ?? ""), quarterly_goals: [...(d.quarterlyReview.quarterly_goals ?? ["","",""]), "","",""].slice(0,3), goals_status: [...(d.quarterlyReview.goals_status ?? ["","",""]), "","",""].slice(0,3), what_worked: d.quarterlyReview.what_worked ?? "", what_to_change: d.quarterlyReview.what_to_change ?? "", next_quarter_focus: d.quarterlyReview.next_quarter_focus ?? "", personal_reflection: d.quarterlyReview.personal_reflection ?? "", relationships_reflection: d.quarterlyReview.relationships_reflection ?? "", wellbeing_reflection: d.quarterlyReview.wellbeing_reflection ?? "", alignment_score: d.quarterlyReview.alignment_score ?? 0 });
        if (d.annualReview) setAnnualDraft({ word_of_year: d.annualReview.word_of_year ?? "", vision_statement: d.annualReview.vision_statement ?? "", focus_buckets: d.annualReview.focus_buckets?.length ? d.annualReview.focus_buckets : [{ label: "Business", description: "", wins: "", grow: "" }, { label: "Health", description: "", wins: "", grow: "" }, { label: "Relationships", description: "", wins: "", grow: "" }, { label: "Personal Growth", description: "", wins: "", grow: "" }], reset_q1: d.annualReview.reset_q1 ?? "", reset_q2: d.annualReview.reset_q2 ?? "", reset_q3: d.annualReview.reset_q3 ?? "", reset_q4: d.annualReview.reset_q4 ?? "", big_wins: [...(d.annualReview.big_wins ?? ["","",""]), "","",""].slice(0,3), releasing: [...(d.annualReview.releasing ?? ["",""]), "",""].slice(0,2), calling_in: [...(d.annualReview.calling_in ?? ["",""]), "",""].slice(0,2) });
      })
      .catch(() => {})
      .finally(() => setLifeLoading(false));
  }, []);

  const lifePost = React.useCallback(async (payload: object) => {
    try {
      const res = await fetch("/api/life", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || json.ok === false) {
        const msg = json.error ?? `Server error ${res.status}`;
        setLifeSaveError(msg);
        setTimeout(() => setLifeSaveError(null), 5000);
        return;
      }
    } catch {
      setLifeSaveError("Network error — check your connection");
      setTimeout(() => setLifeSaveError(null), 5000);
      return;
    }
    loadLifeData();
  }, [loadLifeData]);

  const toggleHabitAnimated = React.useCallback(async (habitId: string, date: string | undefined, logged: boolean) => {
    // Fire animation immediately — don't wait for server
    if (!logged) {
      setHabitJustLogged((s) => new Set([...s, habitId]));
      setTimeout(() => setHabitJustLogged((s) => { const n = new Set(s); n.delete(habitId); return n; }), 700);
    }
    await lifePost({ type: "toggle_habit", habitId, date, logged });
    // After reload, check if all habits are done today
    if (!logged) {
      const fresh = await fetch("/api/life").then((r) => r.json() as Promise<LifeData>).catch(() => null);
      if (fresh) {
        setLifeData(fresh);
        setWaterCups(fresh.waterLog?.cups ?? 0);
        const loggedIds = new Set(fresh.habitLogs.filter((l) => l.logged_date === fresh.today).map((l) => l.habit_id));
        const allDone = fresh.habits.length > 0 && fresh.habits.every((h) => loggedIds.has(h.id));
        if (allDone) triggerCelebration("QUEEN MODE! All habits done today 👑✨");
      }
    }
  }, [lifePost, triggerCelebration]);

  const completeTaskAnimated = React.useCallback(async (taskId: string) => {
    setCompletingTaskId(taskId);
    await fetch("/api/life", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "update_task", id: taskId, status: "done", completed_at: new Date().toISOString() }) });
    setTimeout(() => { setCompletingTaskId(null); loadLifeData(); }, 350);
  }, [loadLifeData]);

  // ── Platform toggles for manual posting ──
  const ALL_PLATFORMS = [
    { key: "linkedin_personal", label: "LinkedIn Personal" },
    { key: "linkedin_wvw",      label: "LinkedIn WVW" },
    { key: "threads",           label: "Threads" },
    { key: "bluesky",           label: "Bluesky" },
    { key: "bluesky_personal",  label: "Bluesky Personal" },
    { key: "facebook",          label: "Facebook" },
  ] as const;
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // ── Strategy alerts ──
  type AlertItem = { type: string; severity: "info" | "warning" | "success"; title: string; body: string; pillar?: string; action?: { label: string; tab?: string } };
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  // ── Generate & Preview ──
  type PreviewPost = { platform: string; text: string; edited: string };
  const [previewing, setPreviewing] = useState(false);
  const [previewPosts, setPreviewPosts] = useState<PreviewPost[]>([]);
  const [previewTheme, setPreviewTheme] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [postingPreview, setPostingPreview] = useState<Record<string, boolean>>({});
  const [postedPreview, setPostedPreview] = useState<Record<string, string>>({});

  // ── Lead attribution ──
  type AttrTheme = { theme: string; posts: number; leads: number; conversions: number; score: number };
  type AttrPlatform = { platform: string; posts: number; leads: number };
  const [attribution, setAttribution] = useState<{ topThemes: AttrTheme[]; topPlatforms: AttrPlatform[]; totalPosts: number; totalLeads: number } | null>(null);

  // ── Real conversions from Supabase ──
  type RealConversion = { id: string; date: string; source_platform: string; conversion_type: string; description: string; value_usd: number; status: string; notes: string };
  const [realConversions, setRealConversions] = useState<RealConversion[]>([]);
  const [showConversionForm, setShowConversionForm] = useState(false);
  const [conversionForm, setConversionForm] = useState({ source_platform: "LinkedIn Personal", conversion_type: "Consultation Inquiry", description: "", value_usd: 0, status: "New", notes: "" });
  const [conversionSaving, setConversionSaving] = useState(false);

  // ── Real leads from Supabase ──
  const [realLeads, setRealLeads] = useState<CommunityInteraction[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState({
    platform: "LinkedIn Personal",
    interaction_type: "Inquiry",
    user_name: "",
    message_summary: "",
    lead_flag: false,
    follow_up_needed: false,
    follow_up_status: "New",
    notes: "",
  });
  const [leadSaving, setLeadSaving] = useState(false);

  // ── Real social stats from Supabase ──
  type StatRow = { platform: string; followers: number; engagement: number; ctr: number; posts: number; lead_score: number; updated_at: string | null };
  const [realStats, setRealStats] = useState<StatRow[] | null>(null);
  const [statsEditing, setStatsEditing] = useState(false);
  const [statsDraft, setStatsDraft] = useState<StatRow[]>([]);
  const [statsSaving, setStatsSaving] = useState(false);
  const [testPosting, setTestPosting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { status: string; error?: string; reason?: string }>>({});

  const themeStream    = useStream();
  const wisdomStream   = useStream();
  const nlStream       = useStream();
  const ssStream       = useStream();
  const blogStream     = useStream();
  const signalStream   = useStream();
  const activeStream = modal?.title.includes("Theme") ? themeStream
    : modal?.title.includes("Newsletter") ? nlStream
    : modal?.title.includes("Substack") ? ssStream
    : modal?.title.includes("Blog") ? blogStream
    : modal?.title.includes("Signal") ? signalStream
    : wisdomStream;

  // ── Fetch real content data ──
  useEffect(() => {
    fetch("/api/data/content")
      .then((r) => r.json())
      .then((d: ContentData) => setContentData(d))
      .catch(() => setContentData(null))
      .finally(() => setContentLoading(false));
  }, []);

  const fetchReddit = React.useCallback(() => {
    setRedditLoading(true);
    fetch("/api/reddit", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { signals: RedditSignal[]; fetchedAt: string }) => {
        setRedditSignals(d.signals ?? []);
        setRedditFetchedAt(d.fetchedAt ?? null);
      })
      .catch(() => {})
      .finally(() => setRedditLoading(false));
  }, []);

  const fetchSocialStats = React.useCallback(() => {
    fetch("/api/social-stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((rows: unknown) => { if (Array.isArray(rows)) setRealStats(rows as StatRow[]); })
      .catch(() => {});
  }, []);

  const refreshContent = () => {
    setContentLoading(true);
    loadLifeData();
    fetchReddit();
    fetchSocialStats();
    fetch("/api/data/content", { cache: "no-store" })
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
      .then((d: PostingStatus) => {
        setPostingStatus(d);
        if (d.todayPlatforms?.length) setSelectedPlatforms(d.todayPlatforms);

        // Show banner for any cron activity since last visit
        const lastVisit = localStorage.getItem("wvw_last_visit");
        const cutoff = lastVisit ? new Date(lastVisit) : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const newEntries = (d.recentPosts ?? []).filter((p) => new Date(p.timestamp) > cutoff);
        if (newEntries.length > 0) {
          const posted = newEntries.filter((p) => p.status === "posted").length;
          const failed = newEntries.filter((p) => p.status === "error" || p.status === "skipped").length;
          const latestTheme = newEntries[0]?.theme ?? "";
          setCronBanner({ posted, failed, label: latestTheme, since: cutoff.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) });
        }
        localStorage.setItem("wvw_last_visit", new Date().toISOString());
      })
      .catch((err) => console.error("[posting/status]", err))
      .finally(() => setPostingLoading(false));
  }, []);

  useEffect(() => { fetchReddit(); }, [fetchReddit]);

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

  // ── Fetch real leads ──
  const fetchLeads = () => {
    setLeadsLoading(true);
    fetch("/api/leads", { cache: "no-store" })
      .then((r) => r.json())
      .then((rows: unknown) => {
        if (!Array.isArray(rows)) return;
        const typed = rows as Array<{ id: string; date: string; platform: string; interaction_type: string; user_name: string; message_summary: string; lead_flag: boolean; follow_up_needed: boolean; follow_up_status: string; related_content: string; notes: string }>;
        setRealLeads(typed.map((r) => ({
          id: r.id,
          date: r.date,
          platform: r.platform as CommunityInteraction["platform"],
          interactionType: r.interaction_type as CommunityInteraction["interactionType"],
          userName: r.user_name,
          messageSummary: r.message_summary,
          leadFlag: r.lead_flag,
          followUpNeeded: r.follow_up_needed,
          followUpStatus: r.follow_up_status as CommunityInteraction["followUpStatus"],
          relatedContent: r.related_content,
          notes: r.notes,
        })));
      })
      .catch(() => {})
      .finally(() => setLeadsLoading(false));
  };
  useEffect(fetchLeads, []);

    // ── Fetch social stats ──
  useEffect(() => { fetchSocialStats(); }, [fetchSocialStats]);

  // ── Fetch content queue ──
  const fetchQueue = () => {
    setQueueLoading(true);
    setQueueError(null);
    fetch("/api/queue", { cache: "no-store" })
      .then((r) => r.json())
      .then((rows: unknown) => {
        if (Array.isArray(rows)) {
          setQueue(rows as QueueItem[]);
        } else if (rows && typeof rows === "object" && "error" in rows) {
          setQueueError((rows as { error: string }).error);
        }
      })
      .catch((e) => setQueueError(String(e)))
      .finally(() => setQueueLoading(false));
  };
  useEffect(fetchQueue, []);

  // ── Load Life OS data on mount ──
  useEffect(() => { loadLifeData(); }, [loadLifeData]);

  // ── Fetch strategy alerts ──
  useEffect(() => {
    fetch("/api/analytics/alerts", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { alerts: AlertItem[] }) => setAlerts(d.alerts ?? []))
      .catch(() => {});
  }, []);

  // ── Fetch attribution ──
  useEffect(() => {
    fetch("/api/analytics/attribution", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: typeof attribution) => setAttribution(d))
      .catch(() => {});
  }, []);

  // ── Fetch real conversions ──
  const fetchConversions = () => {
    fetch("/api/conversions", { cache: "no-store" })
      .then((r) => r.json())
      .then((rows: unknown) => { if (Array.isArray(rows)) setRealConversions(rows as RealConversion[]); })
      .catch(() => {});
  };
  useEffect(fetchConversions, []);

  // ── Focus timer tick ──
  useEffect(() => {
    if (focusActive) {
      focusInterval.current = setInterval(() => {
        setFocusSeconds((s) => {
          if (s > 0) return s - 1;
          setFocusMinutes((m) => {
            if (m > 0) return m - 1;
            // Timer done
            setFocusActive(false);
            setFocusMode((mode) => {
              const next = mode === "work" ? "break" : "work";
              if (next === "break") {
                triggerCelebration("Focus session done! Take a 5-min break 🧘🏾‍♀️");
                setFocusMinutes(5);
              } else {
                setFocusMinutes(25);
              }
              return next;
            });
            return 0;
          });
          return 59;
        });
      }, 1000);
    } else {
      if (focusInterval.current) clearInterval(focusInterval.current);
    }
    return () => { if (focusInterval.current) clearInterval(focusInterval.current); };
  }, [focusActive, triggerCelebration]);

  // ── Medication search debounce ──
  const searchMedication = React.useCallback((query: string) => {
    if (medSearchTimer.current) clearTimeout(medSearchTimer.current);
    if (!query || query.length < 2) { setMedSearchResult(null); return; }
    medSearchTimer.current = setTimeout(async () => {
      setMedSearchLoading(true);
      try {
        const res = await fetch(`/api/medication-info?name=${encodeURIComponent(query)}`);
        const data = await res.json() as { found: boolean; normalizedName?: string; commonBrands?: string[]; commonDoses?: string[]; whenToTake?: string; frequency?: string; symptomsToTrack?: string[]; notes?: string };
        if (data.found) {
          setMedSearchResult(data as Parameters<typeof setMedSearchResult>[0]);
          setNewMedForm((f) => ({
            ...f,
            name: data.normalizedName ?? f.name,
            dose: data.commonDoses?.[0] ?? f.dose,
            frequency: data.frequency ?? f.frequency,
            when_to_take: data.whenToTake ?? f.when_to_take,
            symptoms_to_track: data.symptomsToTrack ?? f.symptoms_to_track,
          }));
        } else {
          setMedSearchResult(null);
        }
      } catch { setMedSearchResult(null); }
      finally { setMedSearchLoading(false); }
    }, 600);
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

  const generatePreview = async () => {
    if (selectedPlatforms.length === 0) return;
    setPreviewing(true);
    setPreviewPosts([]);
    setPreviewError(null);
    setPostedPreview({});
    try {
      const res = await fetch("/api/generate/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms: selectedPlatforms, theme: postingStatus?.todayTheme }),
      });
      const data = await res.json() as { posts?: Record<string, string>; theme?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Generation failed");
      setPreviewTheme(data.theme ?? "");
      const posts = Object.entries(data.posts ?? {}).map(([platform, text]) => ({
        platform, text: text ?? "", edited: text ?? "",
      }));
      setPreviewPosts(posts);
    } catch (err) {
      setPreviewError((err as Error).message);
    } finally {
      setPreviewing(false);
    }
  };

  const postSinglePreview = async (platform: string, text: string) => {
    setPostingPreview((s) => ({ ...s, [platform]: true }));
    try {
      const res = await fetch("/api/posting/post-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, text, theme: previewTheme }),
      });
      const data = await res.json() as { status: string; error?: string };
      setPostedPreview((s) => ({ ...s, [platform]: data.status === "posted" ? "✓ Posted" : `✗ ${data.error ?? "Error"}` }));
    } catch (err) {
      setPostedPreview((s) => ({ ...s, [platform]: `✗ ${String(err)}` }));
    } finally {
      setPostingPreview((s) => ({ ...s, [platform]: false }));
    }
  };

  const triggerPosting = async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const body = selectedPlatforms.length ? { platforms: selectedPlatforms } : {};
      const res = await fetch("/api/posting/trigger", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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

  const triggerBlackExcellence = async () => {
    setBeTriggering(true);
    setBeResult(null);
    try {
      const res = await fetch("/api/posting/trigger-black-excellence", { method: "POST" });
      const data = await res.json() as { category?: string; subject?: string; results?: Record<string, { status: string }> };
      const summary = Object.entries(data.results ?? {})
        .map(([p, r]) => `${p.replace(/_/g, " ")}: ${r.status}`)
        .join(" · ");
      setBeResult(data.subject ? `${data.category} · ${data.subject} — ${summary || "sent"}` : "Done");
      fetch("/api/posting/status").then((r) => r.json()).then((d: PostingStatus) => setPostingStatus(d)).catch(() => {});
    } catch {
      setBeResult("Error — check credentials");
    } finally {
      setBeTriggering(false);
    }
  };

  const submitLead = async () => {
    if (!leadForm.user_name.trim() || !leadForm.message_summary.trim()) return;
    setLeadSaving(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadForm),
      });
      setLeadForm({ platform: "LinkedIn Personal", interaction_type: "Inquiry", user_name: "", message_summary: "", lead_flag: false, follow_up_needed: false, follow_up_status: "New", notes: "" });
      setShowLeadForm(false);
      fetchLeads();
    } finally {
      setLeadSaving(false);
    }
  };

  const generateToQueue = async () => {
    setGeneratingToQueue(true);
    setQueueGenResult(null);
    try {
      const body = selectedPlatforms.length ? { platforms: selectedPlatforms } : {};
      const res = await fetch("/api/posting/generate-to-queue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json() as { queued?: number; error?: string; message?: string };
      if (data.error) {
        setQueueGenResult(`Error: ${data.error}`);
      } else if (data.message) {
        setQueueGenResult(data.message);
      } else {
        setQueueGenResult(`✓ ${data.queued ?? 0} draft${data.queued !== 1 ? "s" : ""} added to queue`);
        fetchQueue();
        setActiveTab("autopost");
      }
    } catch (err) {
      setQueueGenResult(`Error: ${String(err)}`);
    } finally {
      setGeneratingToQueue(false);
    }
  };

  const generateFromAlert = async (alertIndex: number, pillar: string) => {
    setAlertGenerating((s) => ({ ...s, [alertIndex]: true }));
    setAlertGenResult((s) => ({ ...s, [alertIndex]: "" }));
    try {
      const res = await fetch("/api/posting/generate-to-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: pillar }),
      });
      const data = await res.json() as { queued?: number; error?: string };
      setAlertGenResult((s) => ({
        ...s,
        [alertIndex]: data.error ? `Error: ${data.error}` : `✓ ${data.queued ?? 0} draft${data.queued !== 1 ? "s" : ""} queued`,
      }));
      fetchQueue();
    } catch (err) {
      setAlertGenResult((s) => ({ ...s, [alertIndex]: `Error: ${String(err)}` }));
    } finally {
      setAlertGenerating((s) => ({ ...s, [alertIndex]: false }));
    }
  };

  const approveQueueItem = async (item: QueueItem) => {
    setQueuePosting((p) => ({ ...p, [item.id]: true }));
    try {
      const text = editingQueue[item.id] ?? item.text;
      await fetch(`/api/queue/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve", text }) });
      fetchQueue();
      // Refresh post log
      fetch("/api/posting/status").then((r) => r.json()).then((d: PostingStatus) => setPostingStatus(d)).catch(() => {});
    } finally {
      setQueuePosting((p) => ({ ...p, [item.id]: false }));
    }
  };

  const rejectQueueItem = async (id: string) => {
    await fetch(`/api/queue/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reject" }) });
    fetchQueue();
  };

  const deleteQueueItem = async (id: string) => {
    await fetch("/api/queue", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchQueue();
  };

  const submitConversion = async () => {
    if (!conversionForm.description.trim()) return;
    if (conversionForm.value_usd < 0) return;
    setConversionSaving(true);
    try {
      await fetch("/api/conversions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(conversionForm) });
      setConversionForm({ source_platform: "LinkedIn Personal", conversion_type: "Consultation Inquiry", description: "", value_usd: 0, status: "New", notes: "" });
      setShowConversionForm(false);
      fetchConversions();
    } finally {
      setConversionSaving(false);
    }
  };

  const saveStats = async () => {
    setStatsSaving(true);
    try {
      await fetch("/api/social-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statsDraft),
      });
      setRealStats(statsDraft.map((r) => ({ ...r, updated_at: new Date().toISOString() })));
      setStatsEditing(false);
    } finally {
      setStatsSaving(false);
    }
  };

  const sendTestPost = async (platform: string) => {
    setTestPosting((p) => ({ ...p, [platform]: true }));
    setTestResults((r) => ({ ...r, [platform]: { status: "…" } }));
    try {
      const res = await fetch("/api/posting/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json() as { status: string; error?: string; reason?: string };
      setTestResults((r) => ({ ...r, [platform]: data }));
    } catch (err) {
      setTestResults((r) => ({ ...r, [platform]: { status: "error", error: String(err) } }));
    } finally {
      setTestPosting((p) => ({ ...p, [platform]: false }));
    }
  };

  const generateSubstack = () => {
    if (!ssTheme.trim()) return;
    setModal({ title: "Substack Essay — " + ssTheme });
    ssStream.run("/api/substack/generate", { theme: ssTheme, angle: ssAngle || undefined });
  };

  const generateNewsletter = () => {
    if (!nlTheme.trim()) return;
    setModal({ title: "Newsletter — " + nlSeries });
    nlStream.run("/api/newsletter/create", { series: nlSeries, theme: nlTheme, tone: nlTone || undefined });
  };

  const generateBlog = () => {
    if (!blogTheme.trim()) return;
    setModal({ title: "Blog Post — " + blogTheme });
    blogStream.run("/api/blog/generate", { theme: blogTheme, angle: blogAngle || undefined });
  };

  const generateFromSignal = (theme: string, action: string) => {
    setModal({ title: `Signal Content — ${theme.slice(0, 45)}${theme.length > 45 ? "…" : ""}` });
    signalStream.run("/api/generate/signal", { theme, action });
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

  // Guard: API may return {error:"..."} when Supabase creds are wrong — must be a non-empty array
  const safeStats = Array.isArray(realStats) && realStats.length > 0 ? realStats : null;
  const activeSummary = safeStats
    ? safeStats.map((r) => ({ platform: r.platform, followers: r.followers, engagement: r.engagement, ctr: r.ctr, posts: r.posts, leadScore: r.lead_score }))
    : socialSummary;
  const statsHaveData = safeStats ? safeStats.some((r) => r.followers > 0) : false;
  const statsLastUpdated = safeStats ? (safeStats.find((r) => r.updated_at)?.updated_at ?? null) : null;
  const totalFollowers = activeSummary.reduce((s, r) => s + r.followers, 0);
  const avgEngagement = activeSummary.length
    ? (activeSummary.reduce((s, r) => s + r.engagement, 0) / activeSummary.length).toFixed(1)
    : "0.0";
  const topPlatform = ([...activeSummary].sort((a, b) => b.engagement - a.engagement)[0]) ?? socialSummary[0];
  const topNewsletter = [...newsletters].sort((a, b) => b.favoriteScore - a.favoriteScore)[0];

  // Derive content-count bar data from real CSV
  const platformBarData = contentData
    ? Object.entries(contentData.byPlatform).map(([platform, count]) => ({ platform, count }))
    : activeSummary.map((r) => ({ platform: r.platform, count: r.posts }));

  return (
    <>
      <AnimatePresence>
        {celebration.show && (
          <CelebrationBurst message={celebration.message} onDone={() => setCelebration((s) => ({ ...s, show: false }))} />
        )}
      </AnimatePresence>

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

      {/* ── Sidebar + Main layout ── */}
      <div className="flex h-screen overflow-hidden" style={{ background: N.bg, color: N.text }}>

        {/* ── Sidebar ── */}
        <motion.aside
          initial={{ x: -16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-52 flex-shrink-0 flex flex-col border-r overflow-y-auto"
          style={{ background: N.sidebar, borderColor: N.border }}
        >
          {/* Brand */}
          <div className="px-4 pt-5 pb-3 border-b" style={{ borderColor: N.border }}>
            <p className="font-serif text-base font-bold" style={{ color: N.text }}>WVW</p>
            <p className="text-[11px] mt-0.5 italic" style={{ color: C.gold }}>Soft in appearance.</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-3 space-y-3 overflow-y-auto">
            <div>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: N.muted }}>Life</p>
              {[{ value: "life", emoji: "🌿", label: "Life OS" }].map((i) => (
                <SidebarItem key={i.value} {...i} active={activeTab === i.value} onClick={() => setActiveTab(i.value)} />
              ))}
            </div>
            <div>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: N.muted }}>Content</p>
              {[
                { value: "overview",    emoji: "📊", label: "Overview" },
                { value: "autopost",    emoji: "⚡", label: "Auto-Post" },
                { value: "publish",     emoji: "🚀", label: "Publish" },
                { value: "wisdom",      emoji: "✨", label: "Wisdoms" },
                { value: "content",     emoji: "📝", label: "Content" },
                { value: "calendar",    emoji: "📅", label: "Calendar" },
                { value: "newsletters", emoji: "📧", label: "Newsletters" },
              ].map((i) => (
                <SidebarItem key={i.value} {...i} active={activeTab === i.value} onClick={() => setActiveTab(i.value)} />
              ))}
            </div>
            <div>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: N.muted }}>Intelligence</p>
              {[
                { value: "socials",       emoji: "🌐", label: "Socials" },
                { value: "insights",      emoji: "🔍", label: "Reddit/Trends" },
                { value: "performance",   emoji: "📈", label: "Performance" },
                { value: "intelligence",  emoji: "🧠", label: "Intelligence" },
                { value: "audience",      emoji: "👥", label: "Audience" },
                { value: "community",     emoji: "💬", label: "Community" },
                { value: "conversions",   emoji: "💰", label: "Conversions" },
              ].map((i) => (
                <SidebarItem key={i.value} {...i} active={activeTab === i.value} onClick={() => setActiveTab(i.value)} />
              ))}
            </div>
            <div>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: N.muted }}>Tools</p>
              {[
                { value: "experiments", emoji: "🧪", label: "Experiments" },
                { value: "repurpose",   emoji: "♻️", label: "Repurpose" },
                { value: "reports",     emoji: "📋", label: "Reports" },
                { value: "website",     emoji: "🌐", label: "Website" },
                { value: "settings",    emoji: "⚙️", label: "Settings" },
              ].map((i) => (
                <SidebarItem key={i.value} {...i} active={activeTab === i.value} onClick={() => setActiveTab(i.value)} />
              ))}
            </div>
          </nav>

          {/* Life Dashboard link */}
          <a
            href="https://wvwlifedashboard.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-2 mb-2 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium transition-colors hover:opacity-90"
            style={{ background: C.gold + "22", color: C.gold, border: `1px solid ${C.gold}44` }}
          >
            <span>🧠</span>
            <span>Operations Hub</span>
            <span className="ml-auto opacity-60">↗</span>
          </a>

          {/* Date footer */}
          <div className="px-4 py-3 border-t text-[11px]" style={{ borderColor: N.border, color: N.muted }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </div>
        </motion.aside>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: N.bg }}>

          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0" style={{ borderColor: N.border, background: N.bg }}>
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="font-serif text-base font-semibold truncate" style={{ color: N.text }}>
                {{ life: "🌿 Life OS", overview: "📊 Overview", autopost: "⚡ Auto-Post", publish: "🚀 Publish", wisdom: "✨ Wisdoms", content: "📝 Content", calendar: "📅 Calendar", newsletters: "📧 Newsletters", socials: "🌐 Socials", insights: "🔍 Reddit / Trends", performance: "📈 Performance", intelligence: "🧠 Intelligence", audience: "👥 Audience", community: "💬 Community", conversions: "💰 Conversions", experiments: "🧪 Experiments", repurpose: "♻️ Repurpose", reports: "📋 Reports", website: "🌐 Website", settings: "⚙️ Settings" }[activeTab] ?? activeTab}
              </h2>
              {cronBanner && (
                <div className="hidden md:flex items-center gap-2 text-xs px-3 py-1 rounded-full" style={{ background: cronBanner.posted > 0 ? C.forest + "15" : C.rose + "15", color: cronBanner.posted > 0 ? C.forest : C.rose }}>
                  {cronBanner.posted > 0 ? `✓ ${cronBanner.posted} posted` : ""}{cronBanner.failed > 0 ? ` · ✗ ${cronBanner.failed} failed` : ""}
                  <button onClick={() => setCronBanner(null)} className="ml-1 opacity-60 hover:opacity-100">×</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Compact KPIs */}
              <div className="hidden lg:flex items-center gap-4 text-xs mr-2" style={{ color: N.muted }}>
                <span><span className="font-semibold" style={{ color: N.text }}>{totalFollowers.toLocaleString()}</span> audience</span>
                <span><span className="font-semibold" style={{ color: N.text }}>{avgEngagement}%</span> engagement</span>
              </div>
              <Button size="sm" className="rounded-xl text-xs h-8" style={{ background: C.forest, color: "#FFF" }} onClick={refreshContent}>
                <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> Refresh
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl text-xs h-8" style={{ borderColor: N.border, color: N.muted }} onClick={() => setActiveTab("autopost")}>
                <Zap className="w-3.5 h-3.5 mr-1.5" /> Auto-Post
              </Button>
            </div>
          </div>

          {/* Scrollable content with page transitions */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, filter: "blur(8px)", y: 8 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                exit={{ opacity: 0, filter: "blur(4px)", y: -4 }}
                transition={SPRING}
                className="p-6"
              >

          {/* ── Tabs (hidden nav, visible content) ── */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="sr-only" />

            {/* ── Life OS ── */}
            <TabsContent value="life" className="space-y-4">
              {lifeLoading && !lifeData ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: C.forest }} /></div>
              ) : (
                <div className="space-y-4">
                  {/* Sub-nav */}
                  <div className="flex gap-1.5 flex-wrap">
                    {([
                      { id: "today",    label: "🌞 Today" },
                      { id: "habits",   label: "🌿 Habits" },
                      { id: "tasks",    label: "📋 Tasks" },
                      { id: "weekly",   label: "📅 Weekly" },
                      { id: "monthly",  label: "🗓️ Monthly" },
                      { id: "quarterly",label: "📊 Quarterly" },
                      { id: "annual",   label: "🌟 Annual" },
                      { id: "library",  label: "📚 Library" },
                      { id: "bucket",   label: "🌍 Bucket" },
                      { id: "wellness", label: "💊 Wellness" },
                      { id: "spiritual",label: "🌙 Spiritual" },
                    ] as const).map(({ id, label }, i) => (
                      <motion.button
                        key={id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={STAGGER(i)}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setLifeTab(id)}
                        className="text-xs px-3 py-1.5 rounded-full border relative overflow-hidden"
                        style={{ background: lifeTab === id ? C.forest : C.ivory, color: lifeTab === id ? C.bone : C.charcoal, borderColor: lifeTab === id ? C.forest : "#DDD7CD", fontWeight: lifeTab === id ? 600 : 400 }}
                      >
                        {label}
                        {lifeTab === id && (
                          <motion.div layoutId="lifeTabIndicator" className="absolute inset-0 rounded-full -z-10" style={{ background: C.forest }} transition={SPRING} />
                        )}
                      </motion.button>
                    ))}
                    <motion.button {...btnTap} onClick={loadLifeData} className="text-xs px-3 py-1.5 rounded-full border ml-auto" style={{ borderColor: "#DDD7CD", color: C.charcoal }}>↻</motion.button>
                  </div>

                  {/* Save error banner */}
                  <AnimatePresence>
                    {lifeSaveError && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={SPRING}
                        className="px-4 py-3 rounded-2xl text-sm font-medium flex items-center justify-between"
                        style={{ background: "#C4A09A22", borderColor: "#C4A09A44", border: "1px solid", color: "#8B3A2A" }}>
                        <span>⚠ Save failed: {lifeSaveError}</span>
                        <button onClick={() => setLifeSaveError(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* TODAY view */}
                  {lifeTab === "today" && (
                    <motion.div key="today" {...FADE_BLUR} className="space-y-4">

                      {/* Vision Anchor — shows word of year + vision if set */}
                      {(lifeData?.annualReview?.word_of_year || lifeData?.annualReview?.vision_statement) && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}
                          className="px-5 py-3 rounded-2xl border flex items-center gap-3"
                          style={{ background: "linear-gradient(135deg, #1C3A2A08, #B8A06A0D)", borderColor: "#B8A06A33" }}>
                          {lifeData.annualReview.word_of_year && (
                            <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: "#B8A06A22", color: "#B8A06A" }}>{lifeData.annualReview.word_of_year}</span>
                          )}
                          {lifeData.annualReview.vision_statement && (
                            <p className="text-xs flex-1 italic" style={{ color: C.charcoal }}>{lifeData.annualReview.vision_statement.slice(0, 120)}{lifeData.annualReview.vision_statement.length > 120 ? "…" : ""}</p>
                          )}
                          <button onClick={() => setLifeTab("annual")} className="text-xs shrink-0" style={{ color: "#B8A06A" }}>Vision →</button>
                        </motion.div>
                      )}

                      {/* ONE THING — hero card */}
                      <motion.div {...cardHover}>
                        <Card className="rounded-3xl shadow-none overflow-hidden" style={{ background: "linear-gradient(135deg, #1C3A2A, #2D5A40)", borderColor: "#B8A06A44" }}>
                          <CardContent className="pt-5 pb-5">
                            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#B8A06A" }}>The ONE Thing Today</p>
                            <p className="text-xs mb-3" style={{ color: "#F5F0E899" }}>If you do nothing else, this matters most.</p>
                            <div className="relative">
                              <textarea
                                value={oneThing}
                                onChange={(e) => {
                                  setOneThing(e.target.value);
                                  setOneThingSaved(false);
                                  if (oneThingTimer.current) clearTimeout(oneThingTimer.current);
                                  oneThingTimer.current = setTimeout(async () => {
                                    await fetch("/api/life", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "save_one_thing", one_thing: e.target.value }) });
                                    setOneThingSaved(true);
                                    setTimeout(() => setOneThingSaved(false), 2000);
                                  }, 800);
                                }}
                                placeholder="What is the single most important thing you could do today?"
                                rows={2}
                                className="w-full text-base font-serif px-4 py-3 rounded-2xl resize-none"
                                style={{ background: "#FFFFFF18", border: "1px solid #B8A06A44", color: "#F5F0E8", caretColor: "#B8A06A" }}
                              />
                              <AnimatePresence>
                                {oneThingSaved && (
                                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute bottom-3 right-3 text-xs" style={{ color: "#B8A06A" }}>Saved ✓</motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>

                      {/* Capacity Synthesis */}
                      {(() => {
                        const energy = lifeData?.todayIntention?.energy_level;
                        const ns = lifeData?.todayIntention?.nervous_system;
                        const sleep = lifeData?.sleepLog?.hours;
                        const social = lifeData?.todayIntention?.social_battery;
                        if (!energy && !ns && !sleep) return null;
                        const energyScore = energy ?? 3;
                        const sleepScore = sleep ? (sleep >= 8 ? 5 : sleep >= 7 ? 4 : sleep >= 6 ? 3 : sleep >= 5 ? 2 : 1) : 3;
                        const nsScore = ns === "regulated" ? 5 : ns === "grounded" ? 4 : ns === "mixed" ? 3 : ns === "activated" ? 2 : ns === "shutdown" ? 1 : 3;
                        const capacity = Math.round(((energyScore + sleepScore + nsScore) / 15) * 100);
                        const color = capacity >= 70 ? C.forest : capacity >= 45 ? C.gold : C.rose;
                        const label = capacity >= 75 ? "Full capacity. Use it wisely." : capacity >= 55 ? "Moderate capacity. Protect your focus." : capacity >= 35 ? "Low capacity. Honor your limits today." : "Depleted. Rest is the work today.";
                        const recentData = (lifeData?.recentIntentions ?? []).filter(r => r.energy_level != null);
                        return (
                          <div className="p-4 rounded-2xl border flex items-center gap-4" style={{ background: color + "0C", borderColor: color + "33" }}>
                            <div className="text-center shrink-0">
                              <p className="text-3xl font-bold font-mono" style={{ color }}>{capacity}%</p>
                              <p className="text-xs" style={{ color }}>Capacity</p>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium" style={{ color: C.warmBlack }}>{label}</p>
                              <div className="flex gap-3 mt-1.5 flex-wrap">
                                {energy != null && <span className="text-xs" style={{ color: C.charcoal }}>Energy {energy}/5</span>}
                                {sleep != null && <span className="text-xs" style={{ color: C.charcoal }}>Sleep {sleep}h</span>}
                                {ns && <span className="text-xs capitalize" style={{ color: C.charcoal }}>NS: {ns}</span>}
                                {social != null && <span className="text-xs" style={{ color: C.charcoal }}>Social battery {social}/5</span>}
                              </div>
                            </div>
                            {recentData.length >= 3 && (
                              <div className="flex items-end gap-0.5 shrink-0 h-8">
                                {recentData.slice(-7).map((r, i) => (
                                  <div key={i} className="w-2 rounded-sm transition-all"
                                    title={`${r.date}: energy ${r.energy_level}`}
                                    style={{ height: `${((r.energy_level ?? 0) / 5) * 100}%`, minHeight: 3, background: (r.energy_level ?? 0) >= 4 ? C.forest : (r.energy_level ?? 0) >= 3 ? C.gold : C.rose, opacity: i === recentData.slice(-7).length - 1 ? 1 : 0.5 + (i / recentData.slice(-7).length) * 0.4 }} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Top row: check-in + top tasks */}
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                        {/* Daily Intention Card */}
                        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="font-serif text-xl">🌅 Daily Intention</CardTitle>
                              <button onClick={() => setIntentionEdit(!intentionEdit)} className="text-xs px-3 py-1 rounded-full" style={{ background: C.forest + "18", color: C.forest }}>{intentionEdit ? "Cancel" : "Edit"}</button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {intentionEdit ? (
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Energy level (1–5)</p>
                                  <div className="flex gap-2">
                                    {[1,2,3,4,5].map((n) => (
                                      <button key={n} onClick={() => setIntentionDraft((s) => ({ ...s, energy_level: n }))} className="w-9 h-9 rounded-full border text-sm font-semibold transition-all" style={{ background: intentionDraft.energy_level === n ? C.forest : C.ivory, color: intentionDraft.energy_level === n ? C.bone : C.charcoal, borderColor: intentionDraft.energy_level === n ? C.forest : "#DDD7CD" }}>{n}</button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Nervous system state</p>
                                  <div className="flex gap-2 flex-wrap">
                                    {[
                                      { value: "regulated", label: "Regulated", desc: "Safe & present" },
                                      { value: "grounded", label: "Grounded", desc: "Calm & clear" },
                                      { value: "activated", label: "Activated", desc: "Anxious / on edge" },
                                      { value: "shutdown", label: "Shutdown", desc: "Flat / depleted" },
                                      { value: "mixed", label: "Mixed", desc: "Hard to read" },
                                    ].map(({ value, label, desc }) => (
                                      <button key={value} onClick={() => setIntentionDraft((d) => ({ ...d, nervous_system: value }))}
                                        className="text-xs px-3 py-1.5 rounded-full border transition-all text-left"
                                        title={desc}
                                        style={{ background: intentionDraft.nervous_system === value ? C.gold : C.ivory, color: intentionDraft.nervous_system === value ? C.warmBlack : C.charcoal, borderColor: intentionDraft.nervous_system === value ? C.gold : "#DDD7CD" }}>{label}</button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Social battery (1 = drained · 5 = full)</p>
                                  <div className="flex gap-2">
                                    {[1,2,3,4,5].map((n) => (
                                      <button key={n} onClick={() => setIntentionDraft((s) => ({ ...s, social_battery: n }))} className="w-9 h-9 rounded-full border text-sm font-semibold transition-all" style={{ background: intentionDraft.social_battery === n ? "#7C6B9E" : C.ivory, color: intentionDraft.social_battery === n ? C.bone : C.charcoal, borderColor: intentionDraft.social_battery === n ? "#7C6B9E" : "#DDD7CD" }}>{n}</button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Mood — what are you actually feeling?</p>
                                  <div className="flex gap-1.5 flex-wrap mb-1">
                                    {["Focused","Anxious","Calm","Overwhelmed","Creative","Disconnected","Energized","Heavy","Grateful","Irritable","Hopeful","Numb"].map((m) => (
                                      <button key={m} onClick={() => setIntentionDraft((s) => ({ ...s, mood: s.mood === m ? "" : m }))} className="text-xs px-2.5 py-1 rounded-full border transition-all" style={{ background: intentionDraft.mood === m ? C.rose + "33" : C.ivory, color: intentionDraft.mood === m ? C.warmBlack : C.charcoal, borderColor: intentionDraft.mood === m ? C.rose : "#DDD7CD" }}>{m}</button>
                                    ))}
                                  </div>
                                  <input value={intentionDraft.mood} onChange={(e) => setIntentionDraft((s) => ({ ...s, mood: e.target.value }))} placeholder="Or type your own..." className="w-full text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                                </div>
                                <div>
                                  <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Top 3 intentions for today</p>
                                  {intentionDraft.top3.map((t, i) => (
                                    <input key={i} value={t} onChange={(e) => setIntentionDraft((s) => { const top3 = [...s.top3]; top3[i] = e.target.value; return { ...s, top3 }; })} placeholder={`Intention ${i + 1}`} className="w-full text-sm px-3 py-2 rounded-xl border mb-1" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                                  ))}
                                </div>
                                <div>
                                  <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Morning note</p>
                                  <textarea value={intentionDraft.morning_note} onChange={(e) => setIntentionDraft((s) => ({ ...s, morning_note: e.target.value }))} rows={2} placeholder="How are you entering this day..." className="w-full text-sm px-3 py-2 rounded-xl border resize-none" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                                </div>
                                <div>
                                  <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>How did you recharge today?</p>
                                  <input value={intentionDraft.recharge} onChange={(e) => setIntentionDraft((s) => ({ ...s, recharge: e.target.value }))} placeholder="Alone time, walk, reading, quiet, creative work..." className="w-full text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                                </div>
                                <div>
                                  <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Evening close — did today align with your vision?</p>
                                  <textarea value={intentionDraft.alignment_note} onChange={(e) => setIntentionDraft((s) => ({ ...s, alignment_note: e.target.value }))} rows={2} placeholder="What moved? What didn't? What would you do differently?" className="w-full text-sm px-3 py-2 rounded-xl border resize-none" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                                </div>
                                <div>
                                  <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Evening note</p>
                                  <textarea value={intentionDraft.evening_note} onChange={(e) => setIntentionDraft((s) => ({ ...s, evening_note: e.target.value }))} rows={2} placeholder="How did today land..." className="w-full text-sm px-3 py-2 rounded-xl border resize-none" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                                </div>
                                <div>
                                  <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Gratitude (3 things)</p>
                                  {intentionDraft.gratitude.map((g, i) => (
                                    <input key={i} value={g} onChange={(e) => setIntentionDraft((s) => { const gratitude = [...s.gratitude]; gratitude[i] = e.target.value; return { ...s, gratitude }; })} placeholder={`Grateful for...`} className="w-full text-sm px-3 py-2 rounded-xl border mb-1" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                                  ))}
                                </div>
                                <button onClick={async () => { await lifePost({ type: "save_intention", ...intentionDraft, top3: intentionDraft.top3.filter(Boolean), gratitude: intentionDraft.gratitude.filter(Boolean) }); setIntentionEdit(false); }} className="text-xs px-4 py-2 rounded-full" style={{ background: C.forest, color: C.bone }}>Save Intention</button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {/* Energy + NS */}
                                <div className="flex gap-3">
                                  {lifeData?.todayIntention?.energy_level != null && (
                                    <div className="flex-1 p-3 rounded-2xl text-center" style={{ background: C.ivory }}>
                                      <p className="text-xs" style={{ color: C.charcoal }}>Energy</p>
                                      <p className="text-2xl font-bold" style={{ color: C.forest }}>{lifeData.todayIntention.energy_level}/5</p>
                                    </div>
                                  )}
                                  {lifeData?.todayIntention?.nervous_system && (
                                    <div className="flex-1 p-3 rounded-2xl text-center" style={{ background: C.ivory }}>
                                      <p className="text-xs" style={{ color: C.charcoal }}>Nervous System</p>
                                      <p className="text-sm font-semibold capitalize" style={{ color: C.gold }}>{lifeData.todayIntention.nervous_system}</p>
                                    </div>
                                  )}
                                </div>
                                {/* Top 3 */}
                                {(lifeData?.todayIntention?.top3 ?? []).filter(Boolean).length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Today&apos;s intentions</p>
                                    {(lifeData?.todayIntention?.top3 ?? []).filter(Boolean).map((t, i) => (
                                      <div key={i} className="flex items-center gap-2 text-sm py-1" style={{ color: C.warmBlack }}>
                                        <span style={{ color: C.forest }}>{i === 0 ? "①" : i === 1 ? "②" : "③"}</span> {t}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {/* Mood + Social Battery row */}
                                {(lifeData?.todayIntention?.mood || lifeData?.todayIntention?.social_battery != null) && (
                                  <div className="flex gap-2 flex-wrap">
                                    {lifeData?.todayIntention?.mood && (
                                      <span className="text-xs px-3 py-1 rounded-full border" style={{ background: C.rose + "15", borderColor: C.rose + "44", color: C.warmBlack }}>
                                        Feeling: {lifeData.todayIntention.mood}
                                      </span>
                                    )}
                                    {lifeData?.todayIntention?.social_battery != null && (
                                      <span className="text-xs px-3 py-1 rounded-full border" style={{ background: "#7C6B9E15", borderColor: "#7C6B9E44", color: C.warmBlack }}>
                                        Social battery: {lifeData.todayIntention.social_battery}/5
                                      </span>
                                    )}
                                  </div>
                                )}
                                {/* Morning note */}
                                {lifeData?.todayIntention?.morning_note && (
                                  <div className="p-3 rounded-2xl" style={{ background: C.ivory }}>
                                    <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Morning</p>
                                    <p className="text-sm" style={{ color: C.warmBlack }}>{lifeData.todayIntention.morning_note}</p>
                                  </div>
                                )}
                                {/* Recharge */}
                                {lifeData?.todayIntention?.recharge && (
                                  <div className="p-3 rounded-2xl" style={{ background: C.ivory }}>
                                    <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Recharge</p>
                                    <p className="text-sm" style={{ color: C.warmBlack }}>🌿 {lifeData.todayIntention.recharge}</p>
                                  </div>
                                )}
                                {/* Alignment */}
                                {lifeData?.todayIntention?.alignment_note && (
                                  <div className="p-3 rounded-2xl border" style={{ background: "#B8A06A08", borderColor: "#B8A06A33" }}>
                                    <p className="text-xs font-medium mb-1" style={{ color: "#B8A06A" }}>Alignment close</p>
                                    <p className="text-sm" style={{ color: C.warmBlack }}>{lifeData.todayIntention.alignment_note}</p>
                                  </div>
                                )}
                                {/* Evening note */}
                                {lifeData?.todayIntention?.evening_note && (
                                  <div className="p-3 rounded-2xl" style={{ background: C.ivory }}>
                                    <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Evening</p>
                                    <p className="text-sm" style={{ color: C.warmBlack }}>{lifeData.todayIntention.evening_note}</p>
                                  </div>
                                )}
                                {/* Gratitude */}
                                {(lifeData?.todayIntention?.gratitude ?? []).filter(Boolean).length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Grateful for</p>
                                    {(lifeData?.todayIntention?.gratitude ?? []).filter(Boolean).map((g, i) => (
                                      <p key={i} className="text-sm py-0.5" style={{ color: C.charcoal }}>💜 {g}</p>
                                    ))}
                                  </div>
                                )}
                                {/* Wins from SMS */}
                                {(lifeData?.todayIntention?.wins ?? []).length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Today&apos;s wins</p>
                                    {(lifeData?.todayIntention?.wins ?? []).map((w, i) => (
                                      <p key={i} className="text-sm py-0.5" style={{ color: C.forest }}>🏆 {w}</p>
                                    ))}
                                  </div>
                                )}
                                {!lifeData?.todayIntention && (
                                  <p className="text-sm italic text-center py-3" style={{ color: C.charcoal }}>Set today&apos;s intention — click Edit. 🌅</p>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Today's top tasks */}
                        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="font-serif text-xl">🔥 Today&apos;s Top 3</CardTitle>
                              <span className="text-xs px-2 py-1 rounded-full" style={{ background: C.forest + "18", color: C.forest }}>
                                {(lifeData?.tasks ?? []).filter((t) => t.status === "open" || t.status === "in_progress").length} open
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {(lifeData?.tasks ?? []).filter((t) => t.status === "open" || t.status === "in_progress").sort((a, b) => (a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0)).slice(0, 3).map((task, i) => (
                              <div key={task.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: C.ivory }}>
                                <span className="text-lg">{i === 0 ? "🔥" : i === 1 ? "⚡" : "📝"}</span>
                                <div className="flex-1">
                                  <p className="text-sm font-medium" style={{ color: C.warmBlack }}>{task.title}</p>
                                  {task.due_date && <p className="text-xs" style={{ color: task.due_date < (lifeData?.today ?? "") ? C.rose : C.charcoal }}>{task.due_date < (lifeData?.today ?? "") ? "⚠️ Overdue" : `Due ${task.due_date}`}</p>}
                                </div>
                                <button onClick={() => lifePost({ type: "update_task", id: task.id, status: "done", completed_at: new Date().toISOString() })} className="text-xs px-2 py-1 rounded-lg" style={{ background: C.forest + "18", color: C.forest }}>Done ✓</button>
                              </div>
                            ))}
                            {(lifeData?.tasks ?? []).filter((t) => t.status === "open" || t.status === "in_progress").length === 0 && (
                              <p className="text-sm italic py-4 text-center" style={{ color: C.charcoal }}>All clear! Add tasks in the Tasks tab. 🙌🏾</p>
                            )}
                            {/* Overdue warning */}
                            {(lifeData?.tasks ?? []).filter((t) => (t.status === "open" || t.status === "in_progress") && t.due_date && t.due_date < (lifeData?.today ?? "")).length > 0 && (
                              <div className="p-3 rounded-2xl border" style={{ borderColor: C.rose + "66", background: C.rose + "11" }}>
                                <p className="text-xs font-semibold" style={{ color: C.rose }}>⚠️ {(lifeData?.tasks ?? []).filter((t) => (t.status === "open" || t.status === "in_progress") && t.due_date && t.due_date < (lifeData?.today ?? "")).length} overdue — check Tasks tab</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Habits quick-check for today — grouped by category */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="font-serif text-xl">🌿 Today&apos;s Habits</CardTitle>
                            <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: C.forest + "18", color: C.forest }}>
                              {(lifeData?.habitLogs ?? []).filter((l) => l.logged_date === lifeData?.today).length}/{(lifeData?.habits ?? []).length} done
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const CAT_ORDER = ["morning","mindfulness","spiritual","health","pet","wellness","chores","work","learning"];
                            const CAT_LABELS: Record<string,string> = {
                              morning:"🌅 Morning", mindfulness:"🧘🏾 Mindfulness", spiritual:"🙏🏾 Spiritual",
                              health:"💪🏾 Health", pet:"🐕 Brownie", wellness:"🌿 Wellness",
                              chores:"🧹 Chores", work:"💼 Work", learning:"📚 Learning",
                            };
                            const grouped = CAT_ORDER.map(cat => ({
                              cat, label: CAT_LABELS[cat] ?? cat,
                              habits: (lifeData?.habits ?? []).filter(h => h.category === cat)
                            })).filter(g => g.habits.length > 0);
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                {grouped.map(({ cat, label, habits: catHabits }) => (
                                  <div key={cat}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: C.charcoal }}>{label}</p>
                                    <div className="space-y-1.5">
                                      {catHabits.map(habit => {
                                        const logged = (lifeData?.habitLogs ?? []).some(l => l.habit_id === habit.id && l.logged_date === lifeData?.today);
                                        const justDone = habitJustLogged.has(habit.id);
                                        return (
                                          <motion.button
                                            key={habit.id}
                                            onClick={() => toggleHabitAnimated(habit.id, lifeData?.today, logged)}
                                            animate={justDone ? { scale: [1, 1.06, 0.96, 1.02, 1] } : { scale: 1 }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-colors duration-200 text-left"
                                            style={{
                                              background: logged ? C.forest : C.ivory,
                                              borderColor: logged ? C.forest : N.border,
                                            }}
                                          >
                                            <span className="text-base leading-none w-5 text-center shrink-0">{habit.emoji}</span>
                                            <span className="flex-1 text-sm font-medium" style={{ color: logged ? "#fff" : C.warmBlack }}>
                                              {habit.name}
                                            </span>
                                            <motion.div
                                              animate={logged ? { scale: 1, opacity: 1 } : { scale: 0.3, opacity: 0 }}
                                              transition={{ type: "spring", stiffness: 500, damping: 22 }}
                                              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                              style={{ background: "rgba(255,255,255,0.22)" }}
                                            >
                                              <span className="text-[11px] font-bold text-white">✓</span>
                                            </motion.div>
                                          </motion.button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>

                      {/* Wellness Quick-Check */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Water */}
                        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-serif text-base font-semibold" style={{ color: C.warmBlack }}>💧 Water Today</p>
                              <button onClick={() => setLifeTab("wellness")} className="text-xs" style={{ color: C.charcoal }}>See all →</button>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex gap-1">
                                {Array.from({ length: waterGoal }).map((_, i) => (
                                  <motion.button
                                    key={i}
                                    onClick={async () => {
                                      const next = i < waterCups ? i : i + 1;
                                      setWaterCups(next);
                                      await lifePost({ type: "set_water", cups: next, goal_cups: waterGoal });
                                    }}
                                    animate={i < waterCups ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                                    className="text-base leading-none"
                                    title={`${i + 1} cup${i + 1 !== 1 ? "s" : ""}`}
                                  >
                                    {i < waterCups ? "💧" : "🩶"}
                                  </motion.button>
                                ))}
                              </div>
                              <span className="text-sm font-medium" style={{ color: waterCups >= waterGoal ? C.forest : C.charcoal }}>
                                {waterCups}/{waterGoal}
                                {waterCups >= waterGoal && " 🎉"}
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Medications */}
                        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-serif text-base font-semibold" style={{ color: C.warmBlack }}>💊 Medications</p>
                              <button onClick={() => setLifeTab("wellness")} className="text-xs" style={{ color: C.charcoal }}>Log →</button>
                            </div>
                            {(lifeData?.medications ?? []).length === 0 ? (
                              <p className="text-xs italic" style={{ color: C.charcoal }}>No meds tracked — add in Wellness tab</p>
                            ) : (
                              <div className="space-y-1">
                                {(lifeData?.medications ?? []).slice(0, 4).map((med) => {
                                  const log = (lifeData?.medLogs ?? []).find((l) => l.medication_name === med.name);
                                  return (
                                    <div key={med.id} className="flex items-center justify-between">
                                      <span className="text-xs" style={{ color: C.warmBlack }}>{med.name}{med.dose ? ` (${med.dose})` : ""}</span>
                                      <span className="text-xs font-medium" style={{ color: log?.taken ? C.forest : C.rose }}>
                                        {log?.taken ? "✓ Taken" : "○ Pending"}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Sleep */}
                        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-serif text-base font-semibold" style={{ color: C.warmBlack }}>🌙 Last Night</p>
                              <button onClick={() => setLifeTab("wellness")} className="text-xs" style={{ color: C.charcoal }}>Log →</button>
                            </div>
                            {lifeData?.sleepLog ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl font-bold font-mono" style={{ color: lifeData.sleepLog.hours && lifeData.sleepLog.hours >= 7 ? C.forest : C.rose }}>{lifeData.sleepLog.hours ?? "—"}</span>
                                  <span className="text-xs" style={{ color: C.charcoal }}>hours</span>
                                  {lifeData.sleepLog.quality ? (
                                    <span className="ml-auto text-sm">{["","😴","😕","😐","🙂","✨"][lifeData.sleepLog.quality]}</span>
                                  ) : null}
                                </div>
                                {lifeData.sleepLog.bedtime && lifeData.sleepLog.wake_time && (
                                  <p className="text-xs" style={{ color: C.charcoal }}>{lifeData.sleepLog.bedtime} → {lifeData.sleepLog.wake_time}</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs italic" style={{ color: C.charcoal }}>Not logged yet — tap Log →</p>
                            )}
                          </CardContent>
                        </Card>

                        {/* Morning Briefing SMS */}
                        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-serif text-base font-semibold" style={{ color: C.warmBlack }}>📱 Morning Text</p>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: C.forest + "18", color: C.forest }}>9 AM ET</span>
                            </div>
                            <p className="text-xs mb-3" style={{ color: C.charcoal }}>
                              Daily briefing: tasks, weekly focus, overdue alerts + motivational close.
                            </p>
                            {smsLastSent && (
                              <p className="text-[10px] mb-2" style={{ color: C.charcoal }}>
                                Last sent: {new Date(smsLastSent).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                              </p>
                            )}
                            <motion.button
                              {...btnTap}
                              disabled={smsSending}
                              onClick={async () => {
                                setSmsSending(true);
                                setSmsPreview(null);
                                try {
                                  const res = await fetch("/api/life", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ type: "send_morning_text" }),
                                  });
                                  const json = await res.json() as { sent?: boolean; preview?: string; error?: string; ok?: boolean; sid?: string };
                                  if (json.sent) {
                                    setSmsLastSent(new Date().toISOString());
                                    setSmsPreview((json.sid ? `SID: ${json.sid}\n` : "") + (json.preview ?? ""));
                                  } else {
                                    setSmsPreview("Error: " + (json.error ?? "Unknown"));
                                  }
                                } catch {
                                  setSmsPreview("Network error — check console");
                                } finally {
                                  setSmsSending(false);
                                }
                              }}
                              className="w-full text-xs py-2 rounded-xl font-semibold transition-opacity disabled:opacity-50"
                              style={{ background: C.forest, color: "#fff" }}
                            >
                              {smsSending ? "Sending…" : "Send Now 📨"}
                            </motion.button>
                            <AnimatePresence>
                              {smsPreview && (
                                <motion.p
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="text-[10px] mt-2 leading-relaxed"
                                  style={{ color: smsPreview.startsWith("Error") ? C.rose : C.forest }}
                                >
                                  {smsPreview.startsWith("Error") ? smsPreview : "✓ Sent! Preview: " + smsPreview.slice(0, 80) + "…"}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>

                        {/* Evening Check-In SMS */}
                        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-serif text-base font-semibold" style={{ color: C.warmBlack }}>🌙 Evening Check-In</p>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "#7C3AED18", color: "#7C3AED" }}>9 PM ET</span>
                            </div>
                            <p className="text-[11px] mb-3" style={{ color: N.muted }}>Thorns & roses, closed tasks, tomorrow&apos;s focus.</p>
                            <motion.button
                              {...btnTap}
                              disabled={eveningSending}
                              onClick={async () => {
                                setEveningSending(true);
                                setEveningPreview(null);
                                try {
                                  const res = await fetch("/api/life", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ type: "send_evening_text" }),
                                  });
                                  const json = await res.json() as { sent?: boolean; preview?: string; error?: string; sid?: string };
                                  if (json.sent) {
                                    setEveningPreview((json.sid ? `SID: ${json.sid}\n` : "") + (json.preview ?? ""));
                                  } else {
                                    setEveningPreview("Error: " + (json.error ?? "Unknown"));
                                  }
                                } catch {
                                  setEveningPreview("Network error");
                                } finally {
                                  setEveningSending(false);
                                }
                              }}
                              className="w-full text-xs py-2 rounded-xl font-semibold transition-opacity disabled:opacity-50"
                              style={{ background: "#7C3AED", color: "#fff" }}
                            >
                              {eveningSending ? "Sending…" : "Send Now 🌙"}
                            </motion.button>
                            <AnimatePresence>
                              {eveningPreview && (
                                <motion.p
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="text-[10px] mt-2 leading-relaxed"
                                  style={{ color: eveningPreview.startsWith("Error") ? C.rose : "#7C3AED" }}
                                >
                                  {eveningPreview.startsWith("Error") ? eveningPreview : "✓ Sent! " + eveningPreview.slice(0, 80) + "…"}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Focus Timer + Brain Dump row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Pomodoro Focus Timer */}
                        <motion.div {...cardHover}>
                          <Card className="rounded-3xl shadow-none h-full" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                            <CardContent className="pt-5 pb-5">
                              <div className="flex items-center justify-between mb-3">
                                <p className="font-serif text-base font-semibold" style={{ color: C.warmBlack }}>
                                  {focusMode === "work" ? "🧠 Focus Timer" : "☕ Break Time"}
                                </p>
                                <div className="flex gap-1.5">
                                  {[25, 45, 60].map((m) => (
                                    <motion.button key={m} {...btnTap}
                                      onClick={() => { if (!focusActive) { setFocusMinutes(m); setFocusSeconds(0); } }}
                                      className="text-xs px-2 py-0.5 rounded-full border"
                                      style={{ background: focusMinutes === m && !focusActive ? C.forest + "18" : "transparent", color: focusMinutes === m && !focusActive ? C.forest : C.charcoal, borderColor: "#DDD7CD" }}
                                    >{m}m</motion.button>
                                  ))}
                                </div>
                              </div>
                              <div className="text-center my-3">
                                <motion.p
                                  className="font-mono text-5xl font-bold tracking-tight"
                                  style={{ color: focusActive ? C.forest : C.warmBlack }}
                                  animate={focusActive ? { scale: [1, 1.01, 1] } : { scale: 1 }}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                >
                                  {String(focusMinutes).padStart(2, "0")}:{String(focusSeconds).padStart(2, "0")}
                                </motion.p>
                                <p className="text-xs mt-1" style={{ color: C.charcoal }}>
                                  {focusMode === "work" ? "Deep work session" : "Rest your nervous system"}
                                </p>
                              </div>
                              <div className="flex gap-2 justify-center">
                                <motion.button
                                  {...btnTap}
                                  onClick={() => setFocusActive((a) => !a)}
                                  className="px-6 py-2 rounded-full text-sm font-semibold"
                                  style={{ background: focusActive ? C.rose : C.forest, color: C.bone }}
                                >
                                  {focusActive ? "⏸ Pause" : "▶ Start"}
                                </motion.button>
                                <motion.button
                                  {...btnTap}
                                  onClick={() => { setFocusActive(false); setFocusMinutes(25); setFocusSeconds(0); setFocusMode("work"); }}
                                  className="px-4 py-2 rounded-full text-sm border"
                                  style={{ borderColor: "#DDD7CD", color: C.charcoal }}
                                >↺ Reset</motion.button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>

                        {/* Brain Dump */}
                        <motion.div {...cardHover}>
                          <Card className="rounded-3xl shadow-none h-full" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                            <CardContent className="pt-5 pb-5 h-full flex flex-col">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-serif text-base font-semibold" style={{ color: C.warmBlack }}>🧹 Brain Dump</p>
                                <AnimatePresence>
                                  {brainDumpSaved && (
                                    <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-xs" style={{ color: C.forest }}>Saved ✓</motion.span>
                                  )}
                                </AnimatePresence>
                              </div>
                              <p className="text-xs mb-2" style={{ color: C.charcoal }}>Dump thoughts here so they don&apos;t hijack your focus. No judgment.</p>
                              <textarea
                                value={brainDump}
                                onChange={(e) => {
                                  setBrainDump(e.target.value);
                                  setBrainDumpSaved(false);
                                  if (brainDumpTimer.current) clearTimeout(brainDumpTimer.current);
                                  brainDumpTimer.current = setTimeout(async () => {
                                    await fetch("/api/life", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "save_brain_dump", brain_dump: e.target.value }) });
                                    setBrainDumpSaved(true);
                                    setTimeout(() => setBrainDumpSaved(false), 2000);
                                  }, 800);
                                }}
                                placeholder="What's bouncing around in your head right now?  Let it out. ✨"
                                rows={5}
                                className="flex-1 text-sm px-3 py-2 rounded-xl border resize-none w-full"
                                style={{ borderColor: "#DDD7CD", background: C.ivory, color: C.warmBlack }}
                              />
                            </CardContent>
                          </Card>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {/* HABITS view — weekly grid grouped by category */}
                  {lifeTab === "habits" && (
                    <motion.div key="habits" {...FADE_BLUR} className="space-y-4">
                    {(() => {
                      const weekDays = Array.from({ length: 7 }, (_, i) => {
                        const d = new Date((lifeData?.weekStart ?? new Date().toISOString().split("T")[0]) + "T12:00:00");
                        d.setDate(d.getDate() + i);
                        return d.toISOString().split("T")[0];
                      });
                      const dayLabels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
                      const CAT_ORDER = ["morning","mindfulness","spiritual","health","pet","wellness","chores","work","learning"];
                      const CAT_LABELS: Record<string,string> = {
                        morning:"🌅 Morning Routine", mindfulness:"🧘🏾 Mindfulness", spiritual:"🙏🏾 Spiritual",
                        health:"💪🏾 Health", pet:"🐕 Brownie", wellness:"🌿 Wellness",
                        chores:"🧹 Chores", work:"💼 Work", learning:"📚 Learning",
                      };
                      const todayLogged = (lifeData?.habitLogs ?? []).filter(l => l.logged_date === lifeData?.today).length;
                      const total = (lifeData?.habits ?? []).length;
                      const pct = total > 0 ? Math.round((todayLogged / total) * 100) : 0;

                      const grouped = CAT_ORDER.map(cat => ({
                        cat, label: CAT_LABELS[cat] ?? cat,
                        habits: (lifeData?.habits ?? []).filter(h => h.category === cat)
                      })).filter(g => g.habits.length > 0);

                      return (
                        <>
                          {/* Progress bar */}
                          <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                            <CardContent className="pt-5 pb-5">
                              <div className="flex items-center justify-between mb-3">
                                <p className="font-serif text-lg font-semibold" style={{ color: C.warmBlack }}>This Week&apos;s Progress</p>
                                <span className="text-sm font-semibold" style={{ color: C.forest }}>{todayLogged}/{total} today · {pct}%</span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ background: N.border }}>
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ background: C.forest }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.6, ease: "easeOut" }}
                                />
                              </div>
                              {pct === 100 && (
                                <motion.p
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-xs font-semibold mt-2 text-center"
                                  style={{ color: C.gold }}
                                >QUEEN MODE — all habits done 👑✨</motion.p>
                              )}
                            </CardContent>
                          </Card>

                          {/* Weekly grid per category */}
                          {grouped.map(({ cat, label, habits: catHabits }) => (
                            <Card key={cat} className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                              <CardHeader className="pb-2 pt-4">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest" style={{ color: C.charcoal }}>{label}</CardTitle>
                              </CardHeader>
                              <CardContent className="pb-4">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr>
                                        <th className="text-left pb-2 pr-4 font-medium min-w-[130px]" style={{ color: C.charcoal }}>Habit</th>
                                        {weekDays.map((d, i) => (
                                          <th key={d} className="text-center pb-2 px-1.5 font-medium" style={{ color: d === lifeData?.today ? C.forest : C.charcoal }}>
                                            <span className="block">{dayLabels[i]}</span>
                                            <span className="block" style={{ color: C.charcoal, fontWeight: 400 }}>{d.slice(8)}</span>
                                          </th>
                                        ))}
                                        <th className="text-center pb-2 px-2 font-medium" style={{ color: C.charcoal }}>Total</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {catHabits.map((habit) => {
                                        const count = weekDays.filter(d => (lifeData?.habitLogs ?? []).some(l => l.habit_id === habit.id && l.logged_date === d)).length;
                                        return (
                                          <tr key={habit.id} className="border-t" style={{ borderColor: "#DDD7CD" }}>
                                            <td className="py-2 pr-4 whitespace-nowrap">
                                              <span className="mr-1.5">{habit.emoji}</span>
                                              <span style={{ color: C.warmBlack }}>{habit.name}</span>
                                            </td>
                                            {weekDays.map(d => {
                                              const logged = (lifeData?.habitLogs ?? []).some(l => l.habit_id === habit.id && l.logged_date === d);
                                              const isFuture = d > (lifeData?.today ?? "");
                                              const justDoneGrid = !isFuture && habitJustLogged.has(habit.id + d);
                                              return (
                                                <td key={d} className="text-center py-2 px-1.5">
                                                  <motion.button
                                                    disabled={isFuture}
                                                    onClick={() => {
                                                      if (!logged) {
                                                        setHabitJustLogged(s => new Set([...s, habit.id + d]));
                                                        setTimeout(() => setHabitJustLogged(s => { const n = new Set(s); n.delete(habit.id + d); return n; }), 600);
                                                      }
                                                      lifePost({ type: "toggle_habit", habitId: habit.id, date: d, logged });
                                                    }}
                                                    animate={justDoneGrid ? { scale: [1, 1.45, 0.85, 1.1, 1] } : { scale: 1 }}
                                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                                    className="w-7 h-7 rounded-full border text-sm font-bold transition-colors duration-150 disabled:opacity-25"
                                                    style={{
                                                      background: logged ? C.forest : "transparent",
                                                      borderColor: logged ? C.forest : N.border,
                                                      color: logged ? "#FFF" : C.charcoal,
                                                    }}
                                                  >
                                                    {logged ? "✓" : "·"}
                                                  </motion.button>
                                                </td>
                                              );
                                            })}
                                            <td className="text-center py-2 font-bold text-xs" style={{ color: count >= 5 ? C.forest : count >= 3 ? C.gold : C.charcoal }}>
                                              {count}/7
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </>
                      );
                    })()}
                    </motion.div>
                  )}

                  {/* TASKS view */}
                  {lifeTab === "tasks" && (
                    <motion.div key="tasks" {...FADE_BLUR} className="space-y-3">
                      {/* Add task form */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader><CardTitle className="font-serif text-xl">📋 Tasks</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex gap-2 flex-wrap">
                            <input value={newTask.title} onChange={(e) => setNewTask((s) => ({ ...s, title: e.target.value }))} placeholder="Add a task..." className="flex-1 text-sm px-3 py-2 rounded-xl border min-w-48" style={{ borderColor: "#DDD7CD", background: C.ivory }} onKeyDown={(e) => e.key === "Enter" && newTask.title && lifePost({ type: "add_task", ...newTask }).then(() => setNewTask({ title: "", priority: "medium", category: "personal", due_date: "" }))} />
                            <select value={newTask.priority} onChange={(e) => setNewTask((s) => ({ ...s, priority: e.target.value }))} className="text-xs px-2 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }}>
                              <option value="high">🔥 High</option>
                              <option value="medium">⚡ Medium</option>
                              <option value="low">📝 Low</option>
                            </select>
                            <select value={newTask.category} onChange={(e) => setNewTask((s) => ({ ...s, category: e.target.value }))} className="text-xs px-2 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }}>
                              <option value="personal">💜 Personal</option>
                              <option value="business">💼 Business</option>
                              <option value="self_care">🌿 Self Care</option>
                              <option value="health">💪🏾 Health</option>
                              <option value="admin">📋 Admin</option>
                            </select>
                            <input type="date" value={newTask.due_date} onChange={(e) => setNewTask((s) => ({ ...s, due_date: e.target.value }))} className="text-xs px-2 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                            <button onClick={() => { if (!newTask.title) return; setAddingTask(true); lifePost({ type: "add_task", ...newTask }).then(() => { setNewTask({ title: "", priority: "medium", category: "personal", due_date: "" }); setAddingTask(false); }); }} disabled={!newTask.title || addingTask} className="text-xs px-4 py-2 rounded-full disabled:opacity-40" style={{ background: C.forest, color: C.bone }}>Add</button>
                          </div>

                          {/* Open tasks */}
                          <div className="space-y-2">
                            {(["high","medium","low"] as const).map((pri) => {
                              const priTasks = (lifeData?.tasks ?? []).filter((t) => t.priority === pri && (t.status === "open" || t.status === "in_progress"));
                              if (!priTasks.length) return null;
                              const priEmoji = { high: "🔥", medium: "⚡", low: "📝" }[pri];
                              return (
                                <div key={pri}>
                                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.charcoal }}>{priEmoji} {pri} priority</p>
                                  <AnimatePresence>
                                    {priTasks.map((task) => (
                                      <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: completingTaskId === task.id ? 0.4 : 1, x: 0, scale: completingTaskId === task.id ? 0.97 : 1 }}
                                        exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        className="flex items-center gap-2 p-3 rounded-xl mb-1"
                                        style={{ background: N.hover }}
                                      >
                                        <motion.button
                                          whileHover={{ scale: 1.15 }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() => completeTaskAnimated(task.id)}
                                          className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
                                          style={{ borderColor: C.forest, color: C.forest }}
                                        >·</motion.button>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm" style={{ color: N.text }}>{task.title}</p>
                                          {task.due_date && <p className="text-xs" style={{ color: task.due_date < (lifeData?.today ?? "") ? C.rose : N.muted }}>{task.due_date < (lifeData?.today ?? "") ? `⚠️ Overdue (${task.due_date})` : `Due ${task.due_date}`}</p>}
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: N.active, color: N.muted }}>{task.category.replace("_"," ")}</span>
                                      </motion.div>
                                    ))}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>

                          {/* Completed today */}
                          {(lifeData?.tasks ?? []).filter((t) => t.status === "done" && t.completed_at?.startsWith(lifeData?.today ?? "")).length > 0 && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.forest }}>✓ Completed today</p>
                              {(lifeData?.tasks ?? []).filter((t) => t.status === "done" && t.completed_at?.startsWith(lifeData?.today ?? "")).map((task) => (
                                <div key={task.id} className="flex items-center gap-2 p-3 rounded-2xl mb-1 opacity-60" style={{ background: C.ivory }}>
                                  <span style={{ color: C.forest }}>✓</span>
                                  <p className="text-sm line-through" style={{ color: C.charcoal }}>{task.title}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* WEEKLY view */}
                  {lifeTab === "weekly" && (
                    <motion.div key="weekly" {...FADE_BLUR} className="space-y-4">
                      {/* Week Plan */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="font-serif text-xl">📅 Week of {lifeData?.weekStart}</CardTitle>
                              <CardDescription style={{ color: C.charcoal }}>Set your intentions, word, and goals for this week.</CardDescription>
                            </div>
                            <button onClick={() => setWeekEdit(!weekEdit)} className="text-xs px-3 py-1 rounded-full" style={{ background: C.forest + "18", color: C.forest }}>{weekEdit ? "Cancel" : "Edit"}</button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {weekEdit ? (
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Word of the week</p>
                                <input value={weekDraft.word_of_week} onChange={(e) => setWeekDraft((s) => ({ ...s, word_of_week: e.target.value }))} placeholder="Grounded" className="w-full text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                              </div>
                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Main focus</p>
                                <textarea value={weekDraft.main_focus} onChange={(e) => setWeekDraft((s) => ({ ...s, main_focus: e.target.value }))} rows={2} placeholder="What matters most this week..." className="w-full text-sm px-3 py-2 rounded-xl border resize-none" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                              </div>
                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Goals (up to 4)</p>
                                {weekDraft.goals.map((g, i) => (
                                  <input key={i} value={g} onChange={(e) => setWeekDraft((s) => { const goals = [...s.goals]; goals[i] = e.target.value; return { ...s, goals }; })} placeholder={`Goal ${i + 1}`} className="w-full text-sm px-3 py-2 rounded-xl border mb-1" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                                ))}
                              </div>
                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Weekly intentions / reflection</p>
                                <textarea value={weekDraft.intentions} onChange={(e) => setWeekDraft((s) => ({ ...s, intentions: e.target.value }))} rows={3} placeholder="What do you want to feel, release, or protect this week..." className="w-full text-sm px-3 py-2 rounded-xl border resize-none" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                              </div>
                              <button onClick={async () => { await lifePost({ type: "save_week_plan", week_start: lifeData?.weekStart, ...weekDraft, goals: weekDraft.goals.filter(Boolean) }); setWeekEdit(false); }} className="text-xs px-4 py-2 rounded-full" style={{ background: C.forest, color: C.bone }}>Save Week Plan</button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                {lifeData?.weekPlan?.word_of_week && (
                                  <div className="p-4 rounded-2xl" style={{ background: C.ivory }}>
                                    <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Word of the Week</p>
                                    <p className="text-xl font-serif font-bold uppercase tracking-widest" style={{ color: C.gold }}>{lifeData.weekPlan.word_of_week}</p>
                                  </div>
                                )}
                                {lifeData?.weekPlan?.main_focus && (
                                  <div className="p-4 rounded-2xl" style={{ background: C.ivory }}>
                                    <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Main Focus</p>
                                    <p className="text-sm" style={{ color: C.warmBlack }}>{lifeData.weekPlan.main_focus}</p>
                                  </div>
                                )}
                                {lifeData?.weekPlan?.intentions && (
                                  <div className="p-4 rounded-2xl" style={{ background: C.ivory }}>
                                    <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Intentions</p>
                                    <p className="text-sm" style={{ color: C.warmBlack }}>{lifeData.weekPlan.intentions}</p>
                                  </div>
                                )}
                                {!lifeData?.weekPlan && <p className="text-sm italic" style={{ color: C.charcoal }}>No week plan yet — click Edit to set one. 📅</p>}
                              </div>
                              <div>
                                {(lifeData?.weekPlan?.goals ?? []).filter(Boolean).length > 0 && (
                                  <div className="p-4 rounded-2xl" style={{ background: C.ivory }}>
                                    <p className="text-xs font-medium mb-2" style={{ color: C.charcoal }}>This Week&apos;s Goals</p>
                                    <div className="space-y-2">
                                      {(lifeData?.weekPlan?.goals ?? []).filter(Boolean).map((g, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm" style={{ color: C.warmBlack }}>
                                          <span className="mt-0.5 shrink-0" style={{ color: C.forest }}>✦</span> {g}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Week habit summary */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader>
                          <CardTitle className="font-serif text-xl">🌿 Habit Progress This Week</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const weekDays = Array.from({ length: 7 }, (_, i) => {
                              const d = new Date((lifeData?.weekStart ?? new Date().toISOString().slice(0,10)) + "T12:00:00");
                              d.setDate(d.getDate() + i);
                              return d.toISOString().split("T")[0];
                            });
                            const totalPossible = (lifeData?.habits ?? []).length * weekDays.filter((d) => d <= (lifeData?.today ?? "")).length;
                            const totalLogged = (lifeData?.habitLogs ?? []).filter((l) => weekDays.includes(l.logged_date)).length;
                            return (
                              <div className="space-y-3">
                                <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: C.ivory }}>
                                  <div className="text-3xl font-bold font-serif" style={{ color: C.forest }}>{totalPossible > 0 ? Math.round((totalLogged / totalPossible) * 100) : 0}%</div>
                                  <div>
                                    <p className="text-sm font-medium" style={{ color: C.warmBlack }}>{totalLogged} of {totalPossible} habit-days logged</p>
                                    <p className="text-xs" style={{ color: C.charcoal }}>Through {weekDays.filter((d) => d <= (lifeData?.today ?? "")).length} days so far this week</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {(lifeData?.habits ?? []).map((habit) => {
                                    const count = weekDays.filter((d) => (lifeData?.habitLogs ?? []).some((l) => l.habit_id === habit.id && l.logged_date === d)).length;
                                    const pct = Math.round((count / 7) * 100);
                                    return (
                                      <div key={habit.id} className="flex items-center gap-3">
                                        <span className="text-lg w-6">{habit.emoji}</span>
                                        <span className="text-xs w-28 shrink-0" style={{ color: C.charcoal }}>{habit.name}</span>
                                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#DDD7CD" }}>
                                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: count >= 5 ? C.forest : count >= 3 ? C.gold : C.rose }} />
                                        </div>
                                        <span className="text-xs w-8 text-right font-semibold" style={{ color: count >= 5 ? C.forest : count >= 3 ? C.gold : C.charcoal }}>{count}/7</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </CardContent>
                      </Card>

                      {/* Open tasks summary for the week */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader>
                          <CardTitle className="font-serif text-xl">📋 Tasks This Week</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                              { label: "Open", count: (lifeData?.tasks ?? []).filter((t) => t.status === "open").length, color: C.charcoal },
                              { label: "In Progress", count: (lifeData?.tasks ?? []).filter((t) => t.status === "in_progress").length, color: C.gold },
                              { label: "Completed Today", count: (lifeData?.tasks ?? []).filter((t) => t.status === "done" && t.completed_at?.startsWith(lifeData?.today ?? "")).length, color: C.forest },
                            ].map(({ label, count, color }) => (
                              <div key={label} className="p-4 rounded-2xl text-center" style={{ background: C.ivory }}>
                                <p className="text-3xl font-bold font-serif" style={{ color }}>{count}</p>
                                <p className="text-xs mt-1" style={{ color: C.charcoal }}>{label}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* ─── MONTHLY REVIEW ─── */}
                  {lifeTab === "monthly" && (
                    <motion.div key="monthly" {...FADE_BLUR} className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 rounded-3xl border" style={{ background: "linear-gradient(135deg, #1C3A2A11, #B8A06A11)", borderColor: "#DDD7CD" }}>
                        <div>
                          <p className="font-serif text-xl font-semibold" style={{ color: C.warmBlack }}>
                            🗓️ {new Date((lifeData?.currentMonth ?? "") + "-15").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: C.charcoal }}>Monthly reflection + goal tracking</p>
                        </div>
                        <AnimatePresence>
                          {monthSaved && <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-sm font-medium" style={{ color: C.forest }}>Saved ✓</motion.span>}
                        </AnimatePresence>
                      </div>

                      {/* Word of the Month + Reflection side-by-side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                          <CardHeader><CardTitle className="font-serif text-lg">✨ Word of the Month</CardTitle></CardHeader>
                          <CardContent>
                            <input value={monthDraft.word_of_month} onChange={(e) => setMonthDraft((s) => ({ ...s, word_of_month: e.target.value }))} placeholder="What word defines this month?" className="w-full text-base font-serif px-4 py-3 rounded-2xl border text-center" style={{ borderColor: "#DDD7CD", background: C.ivory, color: C.warmBlack }} />
                          </CardContent>
                        </Card>
                        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                          <CardHeader><CardTitle className="font-serif text-lg">📊 Habit Summary</CardTitle></CardHeader>
                          <CardContent className="space-y-2">
                            {(lifeData?.habits ?? []).slice(0, 4).map((h) => {
                              const logs = (lifeData?.habitLogsMonth ?? []).filter((l) => l.habit_id === h.id).length;
                              const daysInMonth = new Date((lifeData?.currentYear ?? 2026), parseInt((lifeData?.currentMonth ?? "2026-01").split("-")[1]), 0).getDate();
                              const pct = Math.round((logs / daysInMonth) * 100);
                              return (
                                <div key={h.id}>
                                  <div className="flex justify-between text-xs mb-0.5">
                                    <span style={{ color: C.warmBlack }}>{h.emoji} {h.name}</span>
                                    <span style={{ color: C.charcoal }}>{logs}/{daysInMonth} days ({pct}%)</span>
                                  </div>
                                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#DDD7CD" }}>
                                    <motion.div className="h-full rounded-full" style={{ background: C.forest }} animate={{ width: `${pct}%` }} transition={SPRING_SLOW} />
                                  </div>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Monthly Goals */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader><CardTitle className="font-serif text-lg">🎯 Monthly Goals</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          {monthDraft.top_goals.map((goal, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <motion.button
                                {...btnTap}
                                onClick={() => setMonthDraft((s) => { const c = [...s.goals_completed]; c[i] = !c[i]; return { ...s, goals_completed: c }; })}
                                className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 text-sm"
                                style={{ background: monthDraft.goals_completed[i] ? C.forest : "transparent", borderColor: C.forest, color: C.bone }}
                              >{monthDraft.goals_completed[i] ? "✓" : ""}</motion.button>
                              <input
                                value={goal}
                                onChange={(e) => setMonthDraft((s) => { const g = [...s.top_goals]; g[i] = e.target.value; return { ...s, top_goals: g }; })}
                                placeholder={`Goal ${i + 1}...`}
                                className="flex-1 text-sm px-3 py-2 rounded-xl border"
                                style={{ borderColor: "#DDD7CD", background: C.ivory, textDecoration: monthDraft.goals_completed[i] ? "line-through" : "none", color: monthDraft.goals_completed[i] ? C.charcoal : C.warmBlack }}
                              />
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Books completed this month */}
                      {(() => {
                        const completedThisMonth = (lifeData?.books ?? []).filter((b) => b.completed_at?.startsWith(lifeData?.currentMonth ?? ""));
                        return completedThisMonth.length > 0 ? (
                          <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                            <CardHeader><CardTitle className="font-serif text-lg">📚 Completed This Month</CardTitle></CardHeader>
                            <CardContent>
                              <div className="flex gap-3 flex-wrap">
                                {completedThisMonth.map((b) => (
                                  <div key={b.id} className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{ background: C.ivory }}>
                                    {b.cover_url ? <img src={b.cover_url} alt={b.title} className="w-8 h-10 object-cover rounded-lg" /> : <span className="text-2xl">{b.media_type === "album" ? "🎵" : b.media_type === "audiobook" ? "🎧" : "📖"}</span>}
                                    <div>
                                      <p className="text-xs font-medium" style={{ color: C.warmBlack }}>{b.title}</p>
                                      {b.author && <p className="text-xs" style={{ color: C.charcoal }}>{b.author}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ) : null;
                      })()}

                      {/* Wins + Growth + Gratitude */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { key: "big_wins" as const, label: "🏆 Big Wins", placeholder: "Win this month..." },
                          { key: "growth_areas" as const, label: "🌱 Growth Areas", placeholder: "What I'm working on..." },
                          { key: "grateful_for" as const, label: "💜 Grateful For", placeholder: "I'm grateful for..." },
                        ].map(({ key, label, placeholder }) => (
                          <Card key={key} className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                            <CardHeader><CardTitle className="font-serif text-base">{label}</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                              {monthDraft[key].map((val, i) => (
                                <input key={i} value={val} onChange={(e) => setMonthDraft((s) => { const arr = [...s[key]]; arr[i] = e.target.value; return { ...s, [key]: arr }; })} placeholder={placeholder} className="w-full text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                              ))}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Reflection */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader><CardTitle className="font-serif text-lg">🪞 Monthly Reflection</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-xs" style={{ color: C.charcoal }}>What do you want to carry into next month? What are you leaving behind?</p>
                          <textarea value={monthDraft.reflection} onChange={(e) => setMonthDraft((s) => ({ ...s, reflection: e.target.value }))} placeholder="This month I learned..." rows={4} className="w-full text-sm px-3 py-2 rounded-xl border resize-none" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                          <motion.button {...btnTap} onClick={async () => {
                            await lifePost({ type: "save_monthly_review", month: lifeData?.currentMonth, ...monthDraft, top_goals: monthDraft.top_goals.filter(Boolean), big_wins: monthDraft.big_wins.filter(Boolean), growth_areas: monthDraft.growth_areas.filter(Boolean), grateful_for: monthDraft.grateful_for.filter(Boolean) });
                            setMonthSaved(true); setTimeout(() => setMonthSaved(false), 2500);
                          }} className="w-full py-3 rounded-2xl text-sm font-semibold" style={{ background: C.forest, color: C.bone }}>Save Monthly Review ✓</motion.button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* ─── QUARTERLY REVIEW ─── */}
                  {lifeTab === "quarterly" && (
                    <motion.div key="quarterly" {...FADE_BLUR} className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 rounded-3xl border" style={{ background: "linear-gradient(135deg, #B8A06A11, #C4A09A11)", borderColor: "#DDD7CD" }}>
                        <div>
                          <p className="font-serif text-xl font-semibold" style={{ color: C.warmBlack }}>📊 {lifeData?.currentQuarter ?? "Q2 2026"}</p>
                          <p className="text-xs mt-0.5" style={{ color: C.charcoal }}>Business · Finances · Strategy</p>
                        </div>
                        <AnimatePresence>
                          {quarterSaved && <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-sm font-medium" style={{ color: C.forest }}>Saved ✓</motion.span>}
                        </AnimatePresence>
                      </div>

                      {/* Revenue + Savings */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                          <CardHeader><CardTitle className="font-serif text-lg">💰 Revenue</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Target ($)</p>
                              <input type="number" value={quarterDraft.revenue_target} onChange={(e) => setQuarterDraft((s) => ({ ...s, revenue_target: e.target.value }))} placeholder="0" className="w-full text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                            </div>
                            <div>
                              <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Actual ($)</p>
                              <input type="number" value={quarterDraft.revenue_actual} onChange={(e) => setQuarterDraft((s) => ({ ...s, revenue_actual: e.target.value }))} placeholder="0" className="w-full text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                            </div>
                            {quarterDraft.revenue_target && quarterDraft.revenue_actual && (
                              <div className="p-2 rounded-xl text-center" style={{ background: Number(quarterDraft.revenue_actual) >= Number(quarterDraft.revenue_target) ? C.forest + "15" : C.rose + "15" }}>
                                <p className="text-sm font-semibold" style={{ color: Number(quarterDraft.revenue_actual) >= Number(quarterDraft.revenue_target) ? C.forest : C.rose }}>
                                  {Math.round((Number(quarterDraft.revenue_actual) / Number(quarterDraft.revenue_target)) * 100)}% of goal
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                          <CardHeader><CardTitle className="font-serif text-lg">🏦 Savings</CardTitle></CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Target ($)</p>
                              <input type="number" value={quarterDraft.savings_target} onChange={(e) => setQuarterDraft((s) => ({ ...s, savings_target: e.target.value }))} placeholder="0" className="w-full text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                            </div>
                            <div>
                              <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Actual ($)</p>
                              <input type="number" value={quarterDraft.savings_actual} onChange={(e) => setQuarterDraft((s) => ({ ...s, savings_actual: e.target.value }))} placeholder="0" className="w-full text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                            </div>
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>New Clients</p>
                                <input type="number" value={quarterDraft.new_clients} onChange={(e) => setQuarterDraft((s) => ({ ...s, new_clients: e.target.value }))} placeholder="0" className="w-full text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Leads</p>
                                <input type="number" value={quarterDraft.leads_generated} onChange={(e) => setQuarterDraft((s) => ({ ...s, leads_generated: e.target.value }))} placeholder="0" className="w-full text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Quarterly Goals */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader><CardTitle className="font-serif text-lg">🎯 Quarterly Goals</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          {quarterDraft.quarterly_goals.map((goal, i) => (
                            <div key={i} className="flex gap-2">
                              <input value={goal} onChange={(e) => setQuarterDraft((s) => { const g = [...s.quarterly_goals]; g[i] = e.target.value; return { ...s, quarterly_goals: g }; })} placeholder={`Quarterly goal ${i + 1}...`} className="flex-1 text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                              <select value={quarterDraft.goals_status[i]} onChange={(e) => setQuarterDraft((s) => { const g = [...s.goals_status]; g[i] = e.target.value; return { ...s, goals_status: g }; })} className="text-xs px-2 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }}>
                                <option value="">Status</option>
                                <option value="on_track">✅ On Track</option>
                                <option value="at_risk">⚠️ At Risk</option>
                                <option value="completed">🏆 Done</option>
                                <option value="paused">⏸ Paused</option>
                              </select>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Reflection */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { key: "what_worked" as const, label: "✅ What Worked", placeholder: "Strategies, habits, decisions that moved the needle..." },
                          { key: "what_to_change" as const, label: "🔄 What to Change", placeholder: "What didn't serve you? What needs a new approach?" },
                          { key: "next_quarter_focus" as const, label: "🔮 Next Quarter Focus", placeholder: "What's the ONE thing that will change everything next quarter?" },
                        ].map(({ key, label, placeholder }) => (
                          <Card key={key} className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                            <CardHeader><CardTitle className="font-serif text-base">{label}</CardTitle></CardHeader>
                            <CardContent>
                              <textarea value={quarterDraft[key]} onChange={(e) => setQuarterDraft((s) => ({ ...s, [key]: e.target.value }))} placeholder={placeholder} rows={4} className="w-full text-sm px-3 py-2 rounded-xl border resize-none" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* ─── Personal Life Section ─── */}
                      <div className="pt-2 pb-1">
                        <p className="text-xs font-semibold uppercase tracking-widest px-1 mb-3" style={{ color: "#7C6B9E" }}>🫀 Personal Life — This Quarter</p>
                      </div>

                      {/* Alignment score */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader><CardTitle className="font-serif text-base">🧭 Values Alignment</CardTitle></CardHeader>
                        <CardContent>
                          <p className="text-xs mb-2" style={{ color: C.charcoal }}>How aligned were you with your core values this quarter? (1 = drifted · 5 = deeply aligned)</p>
                          <div className="flex gap-2">
                            {[1,2,3,4,5].map((n) => (
                              <button key={n} onClick={() => setQuarterDraft((s) => ({ ...s, alignment_score: n }))}
                                className="w-10 h-10 rounded-full border text-sm font-semibold transition-all"
                                style={{ background: quarterDraft.alignment_score === n ? "#7C6B9E" : C.ivory, color: quarterDraft.alignment_score === n ? C.bone : C.charcoal, borderColor: quarterDraft.alignment_score === n ? "#7C6B9E" : "#DDD7CD" }}>{n}</button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { key: "personal_reflection" as const, label: "🌱 Personal Growth", placeholder: "How did you grow as a person this quarter? What shifted in how you see yourself?" },
                          { key: "relationships_reflection" as const, label: "🤝 Relationships", placeholder: "How were your key relationships? Who poured into you? Who drained you? What needs tending?" },
                          { key: "wellbeing_reflection" as const, label: "🧘🏾‍♀️ Mind & Body", placeholder: "How did you take care of yourself? What did your nervous system need more of? Less of?" },
                        ].map(({ key, label, placeholder }) => (
                          <Card key={key} className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                            <CardHeader><CardTitle className="font-serif text-base">{label}</CardTitle></CardHeader>
                            <CardContent>
                              <textarea value={quarterDraft[key]} onChange={(e) => setQuarterDraft((s) => ({ ...s, [key]: e.target.value }))} placeholder={placeholder} rows={4} className="w-full text-sm px-3 py-2 rounded-xl border resize-none" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <motion.button {...btnTap} onClick={async () => {
                        const qInfo = lifeData ? { quarter: lifeData.currentQuarter, year: lifeData.currentYear, quarter_num: parseInt(lifeData.currentQuarter.split("Q")[1]) } : { quarter: "2026-Q2", year: 2026, quarter_num: 2 };
                        await lifePost({ type: "save_quarterly_review", ...qInfo, ...quarterDraft, revenue_target: quarterDraft.revenue_target ? Number(quarterDraft.revenue_target) : null, revenue_actual: quarterDraft.revenue_actual ? Number(quarterDraft.revenue_actual) : null, new_clients: quarterDraft.new_clients ? Number(quarterDraft.new_clients) : null, leads_generated: quarterDraft.leads_generated ? Number(quarterDraft.leads_generated) : null, savings_target: quarterDraft.savings_target ? Number(quarterDraft.savings_target) : null, savings_actual: quarterDraft.savings_actual ? Number(quarterDraft.savings_actual) : null, quarterly_goals: quarterDraft.quarterly_goals.filter(Boolean) });
                        setQuarterSaved(true); setTimeout(() => setQuarterSaved(false), 2500);
                      }} className="w-full py-3 rounded-2xl text-sm font-semibold" style={{ background: C.forest, color: C.bone }}>Save Quarterly Review ✓</motion.button>
                    </motion.div>
                  )}

                  {/* ─── ANNUAL REVIEW ─── */}
                  {lifeTab === "annual" && (
                    <motion.div key="annual" {...FADE_BLUR} className="space-y-4">
                      {/* Header */}
                      <div className="p-5 rounded-3xl border text-center" style={{ background: "linear-gradient(135deg, #1C3A2A, #2D5A40)", borderColor: "#B8A06A44" }}>
                        <p className="font-serif text-3xl font-bold" style={{ color: "#F5F0E8" }}>🌟 {lifeData?.currentYear ?? 2026}</p>
                        <p className="text-sm mt-1" style={{ color: "#B8A06A" }}>Your year in full. Reflect. Celebrate. Intend.</p>
                        <AnimatePresence>
                          {annualSaved && <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm font-medium block mt-2" style={{ color: "#B8A06A" }}>Saved ✓</motion.span>}
                        </AnimatePresence>
                      </div>

                      {/* Word of year + Vision */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                          <CardHeader><CardTitle className="font-serif text-lg">✨ Word of the Year</CardTitle></CardHeader>
                          <CardContent>
                            <input value={annualDraft.word_of_year} onChange={(e) => setAnnualDraft((s) => ({ ...s, word_of_year: e.target.value }))} placeholder="One word that defines your year..." className="w-full text-xl font-serif px-4 py-3 rounded-2xl border text-center" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                          </CardContent>
                        </Card>
                        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                          <CardHeader><CardTitle className="font-serif text-lg">🔮 Vision Statement</CardTitle></CardHeader>
                          <CardContent>
                            <textarea value={annualDraft.vision_statement} onChange={(e) => setAnnualDraft((s) => ({ ...s, vision_statement: e.target.value }))} placeholder="Who are you becoming this year?" rows={3} className="w-full text-sm px-3 py-2 rounded-xl border resize-none" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                          </CardContent>
                        </Card>
                      </div>

                      {/* 4 Focus Buckets */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader>
                          <CardTitle className="font-serif text-lg">🪣 4 Focus Buckets</CardTitle>
                          <CardDescription style={{ color: C.charcoal }}>The 4 areas of your life you&apos;re intentionally investing in this year.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {annualDraft.focus_buckets.map((bucket, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={STAGGER(i)} className="p-4 rounded-2xl border space-y-2" style={{ background: C.ivory, borderColor: "#DDD7CD" }}>
                              <div className="flex gap-2">
                                <input value={bucket.label} onChange={(e) => setAnnualDraft((s) => { const b = [...s.focus_buckets]; b[i] = { ...b[i], label: e.target.value }; return { ...s, focus_buckets: b }; })} className="text-sm font-semibold px-3 py-1.5 rounded-xl border flex-1" style={{ borderColor: "#DDD7CD", background: C.bone }} />
                              </div>
                              <input value={bucket.description} onChange={(e) => setAnnualDraft((s) => { const b = [...s.focus_buckets]; b[i] = { ...b[i], description: e.target.value }; return { ...s, focus_buckets: b }; })} placeholder="What does success in this area look like?" className="w-full text-xs px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.bone }} />
                              <div className="grid grid-cols-2 gap-2">
                                <textarea value={bucket.wins} onChange={(e) => setAnnualDraft((s) => { const b = [...s.focus_buckets]; b[i] = { ...b[i], wins: e.target.value }; return { ...s, focus_buckets: b }; })} placeholder="Wins in this area..." rows={2} className="text-xs px-3 py-2 rounded-xl border resize-none" style={{ borderColor: "#DDD7CD", background: C.bone }} />
                                <textarea value={bucket.grow} onChange={(e) => setAnnualDraft((s) => { const b = [...s.focus_buckets]; b[i] = { ...b[i], grow: e.target.value }; return { ...s, focus_buckets: b }; })} placeholder="Where to grow..." rows={2} className="text-xs px-3 py-2 rounded-xl border resize-none" style={{ borderColor: "#DDD7CD", background: C.bone }} />
                              </div>
                            </motion.div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* 4 Reset Questions */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader>
                          <CardTitle className="font-serif text-lg">🔄 4 Reset Questions</CardTitle>
                          <CardDescription style={{ color: C.charcoal }}>Answer honestly. These are just for you.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {[
                            { key: "reset_q1" as const, q: "What served me this year that I want to carry forward?" },
                            { key: "reset_q2" as const, q: "What am I releasing — habits, relationships, beliefs, expectations?" },
                            { key: "reset_q3" as const, q: "What am I calling in — who I am becoming, what I am building?" },
                            { key: "reset_q4" as const, q: "If I could tell myself one thing at the start of next year, what would it be?" },
                          ].map(({ key, q }, i) => (
                            <motion.div key={key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={STAGGER(i)}>
                              <p className="text-xs font-semibold mb-1.5" style={{ color: C.charcoal }}>Q{i + 1}: {q}</p>
                              <textarea value={annualDraft[key]} onChange={(e) => setAnnualDraft((s) => ({ ...s, [key]: e.target.value }))} rows={3} className="w-full text-sm px-3 py-2 rounded-xl border resize-none" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                            </motion.div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Big Wins + Releasing + Calling In */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { key: "big_wins" as const, label: "🏆 Big Wins", placeholder: "A major win this year..." },
                          { key: "releasing" as const, label: "🌬️ Releasing", placeholder: "Letting go of..." },
                          { key: "calling_in" as const, label: "🌟 Calling In", placeholder: "Inviting into my life..." },
                        ].map(({ key, label, placeholder }) => (
                          <Card key={key} className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                            <CardHeader><CardTitle className="font-serif text-base">{label}</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                              {annualDraft[key].map((val, i) => (
                                <input key={i} value={val} onChange={(e) => setAnnualDraft((s) => { const arr = [...s[key]] as string[]; arr[i] = e.target.value; return { ...s, [key]: arr }; })} placeholder={placeholder} className="w-full text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                              ))}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <motion.button {...btnTap} onClick={async () => {
                        await lifePost({ type: "save_annual_review", year: lifeData?.currentYear ?? 2026, ...annualDraft, big_wins: annualDraft.big_wins.filter(Boolean), releasing: annualDraft.releasing.filter(Boolean), calling_in: annualDraft.calling_in.filter(Boolean) });
                        setAnnualSaved(true);
                        setTimeout(() => setAnnualSaved(false), 2500);
                        triggerCelebration("Annual review saved! You did the work, Queen 👑✨");
                      }} className="w-full py-3 rounded-2xl text-sm font-semibold" style={{ background: C.forest, color: C.bone }}>Save Annual Review ✓</motion.button>
                    </motion.div>
                  )}

                  {/* LIBRARY view — books, audiobooks, albums with covers */}
                  {lifeTab === "library" && (
                    <motion.div key="library" {...FADE_BLUR} className="space-y-4">
                      {/* Add new item */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader><CardTitle className="font-serif text-xl">📚 Add to Library</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <input value={newBook.title} onChange={(e) => setNewBook((s) => ({ ...s, title: e.target.value }))} placeholder="Title *" className="text-sm px-3 py-2 rounded-xl border col-span-2" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                            <input value={newBook.author} onChange={(e) => setNewBook((s) => ({ ...s, author: e.target.value }))} placeholder="Author / Artist" className="text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                            <select value={newBook.media_type} onChange={(e) => setNewBook((s) => ({ ...s, media_type: e.target.value }))} className="text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }}>
                              <option value="book">📖 Book</option>
                              <option value="audiobook">🎧 Audiobook</option>
                              <option value="album">🎵 Album</option>
                            </select>
                          </div>
                          <input value={newBook.cover_url} onChange={(e) => setNewBook((s) => ({ ...s, cover_url: e.target.value }))} placeholder="Cover image URL (paste from Google Images, Amazon, etc.)" className="w-full text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                          <div className="flex gap-2 items-center">
                            {newBook.cover_url && <img src={newBook.cover_url} alt="preview" className="w-12 h-12 rounded-xl object-cover border" style={{ borderColor: "#DDD7CD" }} />}
                            <button onClick={() => { if (!newBook.title) return; setAddingBook(true); lifePost({ type: "add_book", ...newBook }).then(() => { setNewBook({ title: "", author: "", genre: "", cover_url: "", media_type: "book" }); setAddingBook(false); }); }} disabled={!newBook.title || addingBook} className="text-xs px-5 py-2 rounded-full disabled:opacity-40 ml-auto" style={{ background: C.forest, color: C.bone }}>+ Add</button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Filters */}
                      <div className="flex gap-2 flex-wrap">
                        {(["all","book","audiobook","album"] as const).map((f) => (
                          <button key={f} onClick={() => setLibFilter(f)} className="text-xs px-3 py-1.5 rounded-full border" style={{ background: libFilter === f ? C.forest : C.ivory, color: libFilter === f ? C.bone : C.charcoal, borderColor: libFilter === f ? C.forest : "#DDD7CD" }}>
                            {f === "all" ? "All" : f === "book" ? "📖 Books" : f === "audiobook" ? "🎧 Audio" : "🎵 Albums"}
                          </button>
                        ))}
                        <div className="w-px mx-1" style={{ background: "#DDD7CD" }} />
                        {(["all","reading","want_to_read","completed"] as const).map((s) => (
                          <button key={s} onClick={() => setLibStatus(s)} className="text-xs px-3 py-1.5 rounded-full border" style={{ background: libStatus === s ? C.gold : C.ivory, color: libStatus === s ? C.warmBlack : C.charcoal, borderColor: libStatus === s ? C.gold : "#DDD7CD" }}>
                            {s === "all" ? "All Status" : s === "reading" ? "In Progress" : s === "want_to_read" ? "Wishlist" : "✅ Done"}
                          </button>
                        ))}
                      </div>

                      {/* Grid with covers */}
                      {(() => {
                        const filtered = (lifeData?.books ?? []).filter((b) =>
                          (libFilter === "all" || (b.media_type ?? "book") === libFilter) &&
                          (libStatus === "all" || b.status === libStatus)
                        );
                        if (!filtered.length) return <p className="text-sm text-center py-8 italic" style={{ color: C.charcoal }}>Nothing here yet — add something above! ✨</p>;
                        return (
                          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {filtered.map((book) => (
                              <motion.div key={book.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl overflow-hidden border group relative" style={{ background: C.ivory, borderColor: "#DDD7CD" }}>
                                {/* Cover */}
                                <div className="relative w-full aspect-[3/4] bg-gradient-to-br overflow-hidden" style={{ background: book.cover_url ? "transparent" : `linear-gradient(135deg, ${C.forest}22, ${C.gold}33)` }}>
                                  {book.cover_url
                                    ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center text-4xl">{(book.media_type ?? "book") === "album" ? "🎵" : (book.media_type ?? "book") === "audiobook" ? "🎧" : "📖"}</div>
                                  }
                                  {/* Status badge */}
                                  <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: book.status === "completed" ? C.forest : book.status === "reading" ? C.gold : "#DDD7CD", color: book.status === "completed" ? C.bone : book.status === "reading" ? C.warmBlack : C.charcoal }}>
                                    {book.status === "completed" ? "✓ Done" : book.status === "reading" ? "Reading" : "Wishlist"}
                                  </div>
                                </div>
                                {/* Info */}
                                <div className="p-3">
                                  <p className="text-xs font-semibold leading-snug line-clamp-2" style={{ color: C.warmBlack }}>{book.title}</p>
                                  {book.author && <p className="text-[11px] mt-0.5 truncate" style={{ color: C.charcoal }}>{book.author}</p>}
                                  <div className="flex gap-1 mt-2">
                                    {book.status === "want_to_read" && <button onClick={() => lifePost({ type: "update_book", id: book.id, status: "reading" })} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: C.gold + "33", color: C.charcoal }}>Start</button>}
                                    {book.status === "reading" && (
                                      <button onClick={() => { lifePost({ type: "update_book", id: book.id, status: "completed" }); triggerCelebration(`Finished: ${book.title} 🎉`); }} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: C.forest + "22", color: C.forest }}>Finish ✓</button>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}

                  {/* BUCKET LIST view */}
                  {lifeTab === "bucket" && (
                    <motion.div key="bucket" {...FADE_BLUR}>
                    <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                      <CardHeader><CardTitle className="font-serif text-xl">🌍 Life Bucket List</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex gap-2 flex-wrap">
                          <input value={newBucket.title} onChange={(e) => setNewBucket((s) => ({ ...s, title: e.target.value }))} placeholder="Something you want to experience..." className="flex-1 text-sm px-3 py-2 rounded-xl border min-w-48" style={{ borderColor: "#DDD7CD", background: C.ivory }} onKeyDown={(e) => e.key === "Enter" && newBucket.title && lifePost({ type: "add_bucket", ...newBucket }).then(() => setNewBucket({ title: "", category: "experience" }))} />
                          <select value={newBucket.category} onChange={(e) => setNewBucket((s) => ({ ...s, category: e.target.value }))} className="text-xs px-2 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }}>
                            <option value="experience">✨ Experience</option>
                            <option value="place">🌍 Place</option>
                            <option value="food">🍽️ Food</option>
                            <option value="adventure">🏔️ Adventure</option>
                            <option value="learning">📚 Learning</option>
                            <option value="relationship">💜 Relationship</option>
                            <option value="creative">🎨 Creative</option>
                          </select>
                          <button onClick={() => { if (!newBucket.title) return; setAddingBucket(true); lifePost({ type: "add_bucket", ...newBucket }).then(() => { setNewBucket({ title: "", category: "experience" }); setAddingBucket(false); }); }} disabled={!newBucket.title || addingBucket} className="text-xs px-4 py-2 rounded-full disabled:opacity-40" style={{ background: C.forest, color: C.bone }}>Add</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(lifeData?.bucketList ?? []).map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl border transition-all" style={{ background: item.completed ? C.forest + "11" : C.ivory, borderColor: item.completed ? C.forest + "33" : "#DDD7CD" }}>
                              <button onClick={() => { lifePost({ type: "toggle_bucket", id: item.id, completed: !item.completed }); if (!item.completed) triggerCelebration(`You did it! ${item.title} 🌍🎉`); }} className="w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors" style={{ background: item.completed ? C.forest : "transparent", borderColor: C.forest, color: item.completed ? C.bone : C.forest }}>
                                {item.completed ? "✓" : ""}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${item.completed ? "line-through opacity-60" : ""}`} style={{ color: C.warmBlack }}>{item.title}</p>
                                <p className="text-xs" style={{ color: C.charcoal }}>{item.category}</p>
                              </div>
                              {item.completed_at && <span className="text-xs shrink-0" style={{ color: C.forest }}>🎉 {item.completed_at.slice(0,10)}</span>}
                            </div>
                          ))}
                        </div>
                        {(lifeData?.bucketList ?? []).length === 0 && (
                          <p className="text-sm italic text-center py-8" style={{ color: C.charcoal }}>Your bucket list is empty — what do you want to do before you kick it? 🌍</p>
                        )}
                      </CardContent>
                    </Card>
                    </motion.div>
                  )}

                  {/* WELLNESS view — water + sleep + medication */}
                  {lifeTab === "wellness" && (
                    <motion.div key="wellness" {...FADE_BLUR} className="space-y-4">
                      {/* Water tracker */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="font-serif text-xl">💧 Water Intake</CardTitle>
                            <span className="text-sm font-semibold" style={{ color: waterCups >= waterGoal ? C.forest : C.charcoal }}>{waterCups} / {waterGoal} cups</span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Visual cup tracker */}
                          <div className="flex gap-2 flex-wrap">
                            {Array.from({ length: waterGoal }).map((_, i) => (
                              <motion.button
                                key={i}
                                whileTap={{ scale: 0.85 }}
                                animate={i < waterCups ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                                onClick={() => {
                                  const newCups = i < waterCups ? i : i + 1;
                                  setWaterCups(newCups);
                                  fetch("/api/life", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "set_water", cups: newCups, goal_cups: waterGoal }) });
                                  if (newCups >= waterGoal) triggerCelebration("Hydrated Queen! 💧👑 All water done!");
                                }}
                                className="w-12 h-14 rounded-2xl border-2 flex items-end justify-center pb-1 text-lg transition-all"
                                style={{ background: i < waterCups ? "#1C3A2A22" : C.ivory, borderColor: i < waterCups ? C.forest : "#DDD7CD" }}
                              >
                                {i < waterCups ? "💧" : "🫙"}
                              </motion.button>
                            ))}
                          </div>
                          <div className="h-3 rounded-full overflow-hidden" style={{ background: "#DDD7CD" }}>
                            <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${C.forest}, #4A9B8F)` }} animate={{ width: `${Math.min(100, (waterCups / waterGoal) * 100)}%` }} transition={{ duration: 0.4 }} />
                          </div>
                          <p className="text-xs text-center" style={{ color: C.charcoal }}>
                            {waterCups === 0 ? "Start your first cup 💧" : waterCups < waterGoal ? `${waterGoal - waterCups} more to go — you got this! 💜` : "Goal reached! 🎉 Your body thanks you."}
                          </p>
                        </CardContent>
                      </Card>

                      {/* Medication check-in */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader>
                          <CardTitle className="font-serif text-xl">💊 Medication Check-In</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {(lifeData?.medications ?? []).length === 0 && (
                            <p className="text-sm italic" style={{ color: C.charcoal }}>No medications added yet. Add one below.</p>
                          )}
                          {(lifeData?.medications ?? []).map((med) => {
                            const log = (lifeData?.medLogs ?? []).find((l) => l.medication_name === med.name);
                            const taken = log?.taken ?? false;
                            return (
                              <div key={med.id} className="p-4 rounded-2xl border flex items-center gap-4" style={{ background: taken ? C.forest + "11" : C.ivory, borderColor: taken ? C.forest + "44" : "#DDD7CD" }}>
                                <motion.button
                                  whileTap={{ scale: 0.85 }}
                                  animate={taken ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                                  onClick={() => {
                                    fetch("/api/life", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "log_medication", medication_name: med.name, taken: !taken }) });
                                    loadLifeData();
                                    if (!taken) triggerCelebration("Meds taken! 💊 Taking care of yourself 💜");
                                  }}
                                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 text-lg transition-all"
                                  style={{ background: taken ? C.forest : "transparent", borderColor: C.forest }}
                                >
                                  {taken ? "✓" : ""}
                                </motion.button>
                                <div className="flex-1">
                                  <p className="text-sm font-medium" style={{ color: C.warmBlack }}>{med.name}</p>
                                  {med.dose && <p className="text-xs" style={{ color: C.charcoal }}>{med.dose}</p>}
                                  {taken && log?.taken_at && <p className="text-xs" style={{ color: C.forest }}>Taken at {new Date(log.taken_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>}
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: taken ? C.forest + "22" : "#DDD7CD", color: taken ? C.forest : C.charcoal }}>{taken ? "Done ✓" : "Pending"}</span>
                              </div>
                            );
                          })}

                          {/* Symptom log */}
                          {(lifeData?.medLogs ?? []).some((l) => l.taken) && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.charcoal }}>How are you feeling today?</p>
                              {["Good","Anxious","Tired","Foggy","Headache","Nauseous","Mood dip","Great"].map((s) => {
                                const currentLog = (lifeData?.medLogs ?? [])[0];
                                const active = currentLog?.symptoms?.includes(s);
                                return (
                                  <button key={s} onClick={() => {
                                    const current = currentLog?.symptoms ?? [];
                                    const updated = active ? current.filter((x) => x !== s) : [...current, s];
                                    fetch("/api/life", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "log_medication", medication_name: (lifeData?.medications[0]?.name ?? ""), taken: currentLog?.taken ?? false, symptoms: updated }) });
                                    loadLifeData();
                                  }} className="inline-block mr-1.5 mb-1.5 text-xs px-3 py-1 rounded-full border transition-colors" style={{ background: active ? C.rose + "33" : C.ivory, color: active ? C.rose : C.charcoal, borderColor: active ? C.rose : "#DDD7CD" }}>
                                    {s}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Add medication — smart autocomplete */}
                          <div className="pt-3 border-t space-y-3" style={{ borderColor: "#DDD7CD" }}>
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.charcoal }}>Add Medication</p>
                              <motion.button {...btnTap} onClick={() => setAddingMedFull((v) => !v)} className="text-xs px-3 py-1 rounded-full" style={{ background: C.forest + "18", color: C.forest }}>
                                {addingMedFull ? "Cancel" : "+ Add"}
                              </motion.button>
                            </div>
                            <AnimatePresence>
                              {addingMedFull && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={SPRING_SLOW}
                                  className="space-y-2 overflow-hidden"
                                >
                                  {/* Search field */}
                                  <div className="relative">
                                    <input
                                      value={medSearchQuery}
                                      onChange={(e) => { setMedSearchQuery(e.target.value); setNewMedForm((f) => ({ ...f, name: e.target.value })); searchMedication(e.target.value); }}
                                      placeholder="Type medication name (e.g. Adderall, Zoloft)..."
                                      className="w-full text-sm px-3 py-2 rounded-xl border"
                                      style={{ borderColor: "#DDD7CD", background: C.ivory }}
                                    />
                                    {medSearchLoading && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin" style={{ color: C.charcoal }} />}
                                  </div>

                                  {/* Auto-populated info */}
                                  {medSearchResult && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={SPRING}
                                      className="p-3 rounded-2xl border space-y-2"
                                      style={{ background: C.forest + "08", borderColor: C.forest + "33" }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold" style={{ color: C.forest }}>✓ Found: {medSearchResult.normalizedName}</span>
                                        {medSearchResult.commonBrands.length > 0 && (
                                          <span className="text-xs" style={{ color: C.charcoal }}>({medSearchResult.commonBrands.slice(0,2).join(", ")})</span>
                                        )}
                                      </div>
                                      <p className="text-xs" style={{ color: C.charcoal }}>⏰ {medSearchResult.whenToTake}</p>
                                      {medSearchResult.notes && <p className="text-xs italic" style={{ color: C.charcoal }}>{medSearchResult.notes}</p>}
                                    </motion.div>
                                  )}

                                  {/* Dose selector */}
                                  {medSearchResult?.commonDoses && medSearchResult.commonDoses.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Common doses — tap to select:</p>
                                      <div className="flex gap-1.5 flex-wrap">
                                        {medSearchResult.commonDoses.map((d) => (
                                          <motion.button key={d} {...btnTap}
                                            onClick={() => setNewMedForm((f) => ({ ...f, dose: d }))}
                                            className="text-xs px-2.5 py-1 rounded-full border"
                                            style={{ background: newMedForm.dose === d ? C.forest : C.ivory, color: newMedForm.dose === d ? C.bone : C.charcoal, borderColor: newMedForm.dose === d ? C.forest : "#DDD7CD" }}
                                          >{d}</motion.button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Manual dose if not from lookup */}
                                  <div className="flex gap-2">
                                    <input value={newMedForm.dose} onChange={(e) => setNewMedForm((f) => ({ ...f, dose: e.target.value }))} placeholder="Dose (e.g. 20mg)" className="flex-1 text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                                    <select value={newMedForm.frequency} onChange={(e) => setNewMedForm((f) => ({ ...f, frequency: e.target.value }))} className="text-xs px-2 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }}>
                                      <option value="daily">Daily</option>
                                      <option value="twice_daily">Twice daily</option>
                                      <option value="as_needed">As needed</option>
                                      <option value="weekly">Weekly</option>
                                    </select>
                                  </div>

                                  {/* When to take */}
                                  <input value={newMedForm.when_to_take} onChange={(e) => setNewMedForm((f) => ({ ...f, when_to_take: e.target.value }))} placeholder="When to take (e.g. Morning with food)" className="w-full text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />

                                  {/* Symptoms to track (from lookup, toggleable) */}
                                  {medSearchResult?.symptomsToTrack && medSearchResult.symptomsToTrack.length > 0 && (
                                    <div>
                                      <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Symptoms to track (tap to select):</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {medSearchResult.symptomsToTrack.map((s) => {
                                          const selected = newMedForm.symptoms_to_track.includes(s);
                                          return (
                                            <motion.button key={s} {...btnTap}
                                              onClick={() => setNewMedForm((f) => ({ ...f, symptoms_to_track: selected ? f.symptoms_to_track.filter((x) => x !== s) : [...f.symptoms_to_track, s] }))}
                                              className="text-xs px-2.5 py-1 rounded-full border"
                                              style={{ background: selected ? C.rose + "33" : C.ivory, color: selected ? C.rose : C.charcoal, borderColor: selected ? C.rose : "#DDD7CD" }}
                                            >{s}</motion.button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  <motion.button
                                    {...btnTap}
                                    disabled={!newMedForm.name.trim()}
                                    onClick={async () => {
                                      if (!newMedForm.name.trim()) return;
                                      await lifePost({ type: "add_medication", ...newMedForm });
                                      setNewMedForm({ name: "", dose: "", frequency: "daily", when_to_take: "", symptoms_to_track: [], notes: "" });
                                      setMedSearchQuery("");
                                      setMedSearchResult(null);
                                      setAddingMedFull(false);
                                    }}
                                    className="w-full py-2.5 rounded-2xl text-sm font-semibold"
                                    style={{ background: newMedForm.name.trim() ? C.forest : "#DDD7CD", color: newMedForm.name.trim() ? C.bone : C.charcoal }}
                                  >
                                    Save Medication
                                  </motion.button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Sleep Tracker */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="font-serif text-xl">🌙 Sleep Last Night</CardTitle>
                            <AnimatePresence>
                              {sleepSaved && (
                                <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-xs" style={{ color: C.forest }}>Saved ✓</motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Hours */}
                          <div className="flex gap-3 items-center flex-wrap">
                            <p className="text-xs font-medium w-24 shrink-0" style={{ color: C.charcoal }}>Hours slept</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {["4","5","6","7","8","9","10"].map((h) => (
                                <motion.button key={h} {...btnTap}
                                  onClick={() => setSleepDraft((s) => ({ ...s, hours: h }))}
                                  className="w-9 h-9 rounded-full border text-sm font-semibold"
                                  style={{ background: sleepDraft.hours === h ? C.forest : C.ivory, color: sleepDraft.hours === h ? C.bone : C.charcoal, borderColor: sleepDraft.hours === h ? C.forest : "#DDD7CD" }}
                                >{h}</motion.button>
                              ))}
                            </div>
                          </div>
                          {/* Quality */}
                          <div className="flex gap-3 items-center flex-wrap">
                            <p className="text-xs font-medium w-24 shrink-0" style={{ color: C.charcoal }}>Quality</p>
                            <div className="flex gap-2">
                              {[
                                { v: 1, label: "😴 Rough" },
                                { v: 2, label: "😕 Meh" },
                                { v: 3, label: "😐 OK" },
                                { v: 4, label: "🙂 Good" },
                                { v: 5, label: "✨ Great" },
                              ].map(({ v, label }) => (
                                <motion.button key={v} {...btnTap}
                                  onClick={() => setSleepDraft((s) => ({ ...s, quality: v }))}
                                  className="text-xs px-2.5 py-1.5 rounded-full border"
                                  style={{ background: sleepDraft.quality === v ? C.gold : C.ivory, color: sleepDraft.quality === v ? C.warmBlack : C.charcoal, borderColor: sleepDraft.quality === v ? C.gold : "#DDD7CD" }}
                                >{label}</motion.button>
                              ))}
                            </div>
                          </div>
                          {/* Times */}
                          <div className="flex gap-3">
                            <div className="flex-1">
                              <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Bedtime</p>
                              <input type="time" value={sleepDraft.bedtime} onChange={(e) => setSleepDraft((s) => ({ ...s, bedtime: e.target.value }))} className="w-full text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>Wake time</p>
                              <input type="time" value={sleepDraft.wake_time} onChange={(e) => setSleepDraft((s) => ({ ...s, wake_time: e.target.value }))} className="w-full text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                            </div>
                          </div>
                          {/* Notes */}
                          <textarea value={sleepDraft.notes} onChange={(e) => setSleepDraft((s) => ({ ...s, notes: e.target.value }))} placeholder="Dreams, sleep quality notes..." rows={2} className="w-full text-sm px-3 py-2 rounded-xl border resize-none" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                          <motion.button
                            {...btnTap}
                            onClick={async () => {
                              await lifePost({ type: "log_sleep", hours: Number(sleepDraft.hours) || null, quality: sleepDraft.quality || null, bedtime: sleepDraft.bedtime || null, wake_time: sleepDraft.wake_time || null, notes: sleepDraft.notes || null });
                              setSleepSaved(true);
                              setTimeout(() => setSleepSaved(false), 2000);
                            }}
                            className="w-full py-2.5 rounded-2xl text-sm font-semibold"
                            style={{ background: C.forest, color: C.bone }}
                          >Log Sleep</motion.button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* SPIRITUAL view — Hoodoo reference guide */}
                  {lifeTab === "spiritual" && (
                    <motion.div key="spiritual" {...FADE_BLUR} className="space-y-4">
                      {/* Header */}
                      <div className="p-4 rounded-3xl border" style={{ background: "linear-gradient(135deg, #1C3A2A11, #B8A06A11)", borderColor: "#DDD7CD" }}>
                        <p className="font-serif text-lg font-semibold" style={{ color: C.warmBlack }}>🌙 Your Spiritual Reference Guide</p>
                        <p className="text-xs mt-1" style={{ color: C.charcoal }}>Hoodoo signs, symbols, and meanings — your growing personal reference. Tap any sign to expand.</p>
                      </div>

                      {/* Search + category filter */}
                      <div className="flex gap-2 flex-wrap">
                        <input value={spiritSearch} onChange={(e) => setSpiritSearch(e.target.value)} placeholder="Search signs..." className="text-sm px-3 py-2 rounded-xl border flex-1 min-w-40" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                        {["All", ...Array.from(new Set((lifeData?.spiritSigns ?? []).map((s) => s.category)))].map((cat) => (
                          <button key={cat} onClick={() => setSpiritCategory(cat)} className="text-xs px-3 py-1.5 rounded-full border transition-all" style={{ background: spiritCategory === cat ? C.warmBlack : C.ivory, color: spiritCategory === cat ? C.bone : C.charcoal, borderColor: spiritCategory === cat ? C.warmBlack : "#DDD7CD" }}>
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Signs list */}
                      {(() => {
                        const signs = (lifeData?.spiritSigns ?? []).filter((s) =>
                          (spiritCategory === "All" || s.category === spiritCategory) &&
                          (!spiritSearch || s.name.toLowerCase().includes(spiritSearch.toLowerCase()) || s.meaning.toLowerCase().includes(spiritSearch.toLowerCase()))
                        );
                        const byCategory: Record<string, typeof signs> = {};
                        signs.forEach((s) => { if (!byCategory[s.category]) byCategory[s.category] = []; byCategory[s.category].push(s); });

                        return Object.entries(byCategory).map(([cat, catSigns]) => (
                          <div key={cat} className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-widest px-1" style={{ color: C.charcoal }}>{cat}</p>
                            {catSigns.map((sign) => (
                              <motion.div key={sign.id} layout className="rounded-2xl overflow-hidden border" style={{ background: C.ivory, borderColor: "#DDD7CD" }}>
                                <button
                                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                                  onClick={() => setSpiritExpanded(spiritExpanded === sign.id ? null : sign.id)}
                                >
                                  <div>
                                    <p className="text-sm font-medium" style={{ color: C.warmBlack }}>{sign.name}</p>
                                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: C.charcoal }}>{sign.meaning}</p>
                                  </div>
                                  <span className="text-xs ml-3 shrink-0" style={{ color: C.charcoal }}>{spiritExpanded === sign.id ? "▲" : "▼"}</span>
                                </button>
                                <AnimatePresence>
                                  {spiritExpanded === sign.id && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                      <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "#DDD7CD" }}>
                                        <div className="pt-3">
                                          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.charcoal }}>Meaning</p>
                                          <p className="text-sm" style={{ color: C.warmBlack }}>{sign.meaning}</p>
                                        </div>
                                        {sign.hoodoo_context && (
                                          <div className="p-3 rounded-xl" style={{ background: "#1C3A2A0D" }}>
                                            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.forest }}>Hoodoo Context</p>
                                            <p className="text-sm" style={{ color: C.warmBlack }}>{sign.hoodoo_context}</p>
                                          </div>
                                        )}
                                        {sign.personal_notes && (
                                          <div className="p-3 rounded-xl" style={{ background: C.gold + "15" }}>
                                            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.gold }}>Your Notes</p>
                                            <p className="text-sm" style={{ color: C.warmBlack }}>{sign.personal_notes}</p>
                                          </div>
                                        )}
                                        {/* Edit personal notes */}
                                        <textarea
                                          defaultValue={sign.personal_notes ?? ""}
                                          placeholder="Add your personal notes, experiences, what this sign has meant for you..."
                                          rows={2}
                                          className="w-full text-xs px-3 py-2 rounded-xl border resize-none"
                                          style={{ borderColor: "#DDD7CD", background: C.bone }}
                                          onBlur={(e) => { if (e.target.value !== (sign.personal_notes ?? "")) { fetch("/api/life", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "update_spirit_sign", id: sign.id, personal_notes: e.target.value }) }); loadLifeData(); } }}
                                        />
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            ))}
                          </div>
                        ));
                      })()}

                      {/* Add your own sign */}
                      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                        <CardHeader><CardTitle className="font-serif text-lg">✍🏾 Add Your Own Sign</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input value={newSign.name} onChange={(e) => setNewSign((s) => ({ ...s, name: e.target.value }))} placeholder="Sign name *" className="text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                            <select value={newSign.category} onChange={(e) => setNewSign((s) => ({ ...s, category: e.target.value }))} className="text-sm px-3 py-2 rounded-xl border" style={{ borderColor: "#DDD7CD", background: C.ivory }}>
                              {["Birds & Animals","Numbers","Moon Phases","Dreams","Colors","Omens","Plants & Herbs","Body Sensations","Other"].map((c) => <option key={c}>{c}</option>)}
                            </select>
                          </div>
                          <textarea value={newSign.meaning} onChange={(e) => setNewSign((s) => ({ ...s, meaning: e.target.value }))} placeholder="What does this sign mean to you? *" rows={2} className="w-full text-sm px-3 py-2 rounded-xl border resize-none" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                          <textarea value={newSign.personal_notes} onChange={(e) => setNewSign((s) => ({ ...s, personal_notes: e.target.value }))} placeholder="Personal notes (optional)..." rows={2} className="w-full text-sm px-3 py-2 rounded-xl border resize-none" style={{ borderColor: "#DDD7CD", background: C.ivory }} />
                          <button onClick={() => {
                            if (!newSign.name || !newSign.meaning) return;
                            setAddingSign(true);
                            lifePost({ type: "add_spirit_sign", ...newSign, is_reference: false }).then(() => {
                              setNewSign({ category: "Omens", name: "", meaning: "", hoodoo_context: "", personal_notes: "" });
                              setAddingSign(false);
                            });
                          }} disabled={!newSign.name || !newSign.meaning || addingSign} className="w-full text-sm py-2.5 rounded-full disabled:opacity-40" style={{ background: C.warmBlack, color: C.bone }}>
                            {addingSign ? "Saving..." : "✍🏾 Save to My Guide"}
                          </button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>
              )}
            </TabsContent>

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
                        {activeSummary.map((row) => (
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
                      <BarChart data={activeSummary}>
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

            </TabsContent>

            {/* ── Reddit / Trends ── */}
            <TabsContent value="insights" className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card className="xl:col-span-2 rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-serif text-xl">Structural Care Signals</CardTitle>
                        <CardDescription style={{ color: C.charcoal }}>Live conversations on Black mental health, CHW structural care, and neuroinclusion — updated hourly.</CardDescription>
                      </div>
                      <button
                        onClick={fetchReddit}
                        disabled={redditLoading}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-opacity disabled:opacity-40"
                        style={{ borderColor: "#DDD7CD", color: C.charcoal, background: C.ivory }}
                      >
                        {redditLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                        Refresh
                      </button>
                    </div>
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
                          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                            <span
                              className="text-xs px-3 py-1.5 rounded-full border"
                              style={{ borderColor: C.gold, color: C.charcoal }}
                            >
                              {signal.action}
                            </span>
                            <button
                              onClick={() => generateFromSignal(signal.theme, signal.action)}
                              disabled={signalStream.loading}
                              className="text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-40 flex items-center gap-1"
                              style={{ borderColor: C.gold, color: C.charcoal, background: C.ivory }}
                            >
                              {signalStream.loading
                                ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
                                : <><Sparkles className="w-3 h-3" style={{ color: C.gold }} /> Generate</>
                              }
                            </button>
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
                              {themeOfMonth === signal.theme ? "✓ Theme" : "Set Theme"}
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
                    <CardDescription style={{ color: C.charcoal }}>Turn one live signal into a full, on-brand structural-care content stack via Claude.</CardDescription>
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
              <NewsletterAnalytics />
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
                    { label: "Claude AI (Generation)", key: "anthropic_key" },
                    { label: "LinkedIn Personal (Buffer)", key: "linkedin_personal_buffer" },
                    { label: "LinkedIn WVW Page (Buffer)", key: "linkedin_wvw_buffer" },
                    { label: "Bluesky",           key: "bluesky" },
                    { label: "Bluesky Personal",  key: "bluesky_personal" },
                    { label: "Facebook WVW",      key: "facebook" },
                    { label: "Instagram (Meta)",  key: "instagram" },
                    { label: "Threads (Buffer)",  key: "threads_buffer" },
                    { label: "TikTok (caption → Buffer, post video manually)", key: "tiktok_buffer" },
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

              {/* ── ANTHROPIC_API_KEY Critical Warning ── */}
              {postingStatus && !postingStatus.connections.anthropic_key && (
                <div className="flex items-start gap-3 p-4 rounded-2xl border-2" style={{ background: "#FEF3C7", borderColor: "#D97706" }}>
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#D97706" }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#92400E" }}>ANTHROPIC_API_KEY is not set — nothing will generate or post</p>
                    <p className="text-xs mt-1" style={{ color: "#92400E" }}>Go to <strong>Vercel → your project → Settings → Environment Variables</strong> and add <code className="px-1 rounded" style={{ background: "#FDE68A" }}>ANTHROPIC_API_KEY</code> with your Anthropic API key. Then redeploy. Without this, all content generation (posts, wisdoms, newsletters, Black Excellence) will fail silently.</p>
                  </div>
                </div>
              )}

              {/* ── Generate & Preview Panel ── */}
              <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                <CardHeader>
                  <CardTitle className="font-serif text-xl flex items-center gap-2">
                    <Eye className="w-4 h-4" style={{ color: C.forest }} /> Generate & Preview
                  </CardTitle>
                  <CardDescription style={{ color: C.charcoal }}>
                    Generate all posts for your selected platforms and review them before anything goes live. Edit inline, then post individually or all at once.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    className="w-full rounded-2xl"
                    style={{ background: C.forest, color: C.bone }}
                    onClick={generatePreview}
                    disabled={previewing || selectedPlatforms.length === 0 || !postingStatus?.connections.anthropic_key}
                  >
                    {previewing
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating previews…</>
                      : <><Eye className="w-4 h-4 mr-2" /> Generate Previews ({selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? "s" : ""})</>
                    }
                  </Button>

                  {!postingStatus?.connections.anthropic_key && (
                    <p className="text-xs text-center" style={{ color: C.rose }}>Add ANTHROPIC_API_KEY to Vercel to enable generation.</p>
                  )}

                  {previewError && (
                    <div className="p-3 rounded-2xl text-xs flex items-start gap-2" style={{ background: C.rose + "15", color: C.rose }}>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span><strong>Generation failed:</strong> {previewError}</span>
                    </div>
                  )}

                  {previewPosts.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium" style={{ color: C.charcoal }}>Theme: <span style={{ color: C.warmBlack }}>{previewTheme}</span></p>
                        <Button
                          size="sm"
                          className="rounded-xl text-xs"
                          style={{ background: C.forest, color: C.bone }}
                          onClick={() => {
                            previewPosts.forEach((p) => {
                              if (!postedPreview[p.platform]) {
                                void postSinglePreview(p.platform, p.edited || p.text);
                              }
                            });
                          }}
                          disabled={Object.values(postingPreview).some(Boolean)}
                        >
                          <Play className="w-3 h-3 mr-1" /> Post All
                        </Button>
                      </div>
                      {previewPosts.map((p) => (
                        <div key={p.platform} className="rounded-2xl border overflow-hidden" style={{ borderColor: "#DDD7CD" }}>
                          <div className="flex items-center justify-between px-4 py-2" style={{ background: C.ivory }}>
                            <span className="text-xs font-semibold" style={{ color: C.warmBlack }}>{p.platform.replace(/_/g, " ")}</span>
                            <div className="flex items-center gap-2">
                              {postedPreview[p.platform] && (
                                <span className="text-[11px] font-medium" style={{ color: postedPreview[p.platform]?.startsWith("✓") ? C.forest : C.rose }}>
                                  {postedPreview[p.platform]}
                                </span>
                              )}
                              {!postedPreview[p.platform] && (
                                <button
                                  onClick={() => postSinglePreview(p.platform, p.edited || p.text)}
                                  disabled={!!postingPreview[p.platform]}
                                  className="text-[11px] px-3 py-1 rounded-xl border transition-colors disabled:opacity-40"
                                  style={{ borderColor: C.forest, color: C.forest, background: C.bone }}
                                >
                                  {postingPreview[p.platform] ? <Loader2 className="w-3 h-3 animate-spin" /> : "Post this"}
                                </button>
                              )}
                            </div>
                          </div>
                          <textarea
                            value={p.edited}
                            onChange={(e) => setPreviewPosts((prev) =>
                              prev.map((pp) => pp.platform === p.platform ? { ...pp, edited: e.target.value } : pp)
                            )}
                            rows={Math.min(10, Math.ceil(p.text.length / 60))}
                            className="w-full p-4 text-xs resize-y focus:outline-none"
                            style={{ background: C.bone, color: C.charcoal, minHeight: "5rem" }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

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
                    <div>
                      <p className="text-xs font-medium mb-2" style={{ color: C.charcoal }}>
                        Select platforms to post to — toggle to add or remove:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ALL_PLATFORMS.map(({ key, label }) => {
                          const on = selectedPlatforms.includes(key);
                          const connected = postingStatus?.connections[
                            key === "linkedin_personal" ? "linkedin_personal_buffer"
                            : key === "linkedin_wvw" ? "linkedin_wvw_buffer"
                            : key === "threads" ? "threads_buffer"
                            : key
                          ];
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() =>
                                setSelectedPlatforms((prev) =>
                                  prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
                                )
                              }
                              className="px-3 py-1.5 rounded-2xl text-xs font-medium border transition-all"
                              style={{
                                background: on ? C.forest : C.ivory,
                                color: on ? C.bone : C.charcoal,
                                borderColor: on ? C.forest : connected ? "#DDD7CD" : C.rose + "88",
                                opacity: connected === false ? 0.6 : 1,
                              }}
                              title={connected === false ? "Not connected — add credentials in Settings" : undefined}
                            >
                              {on ? "✓ " : ""}{label}
                            </button>
                          );
                        })}
                      </div>
                      {selectedPlatforms.length === 0 && (
                        <p className="text-xs mt-2" style={{ color: C.rose }}>Select at least one platform.</p>
                      )}
                    </div>

                    {!(postingStatus?.connections.linkedin_personal_buffer && postingStatus?.connections.linkedin_wvw_buffer) && (
                      <a
                        href="https://publish.buffer.com/channels"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full rounded-2xl py-2.5 text-sm font-medium border transition-colors"
                        style={{ borderColor: C.gold, color: C.charcoal, background: C.ivory }}
                      >
                        <Link2 className="w-4 h-4" style={{ color: C.gold }} />
                        Connect LinkedIn in Buffer
                      </a>
                    )}

                    <Button
                      className="w-full rounded-2xl mt-2"
                      style={{ background: C.forest, color: C.bone }}
                      onClick={triggerPosting}
                      disabled={triggering || wisdomTriggering || selectedPlatforms.length === 0}
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

                    <Button
                      className="w-full rounded-2xl"
                      variant="outline"
                      style={{ borderColor: C.forest, color: C.forest }}
                      onClick={triggerBlackExcellence}
                      disabled={beTriggering || triggering || wisdomTriggering}
                    >
                      {beTriggering
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                        : <><Users className="w-4 h-4 mr-2" /> Send Black Excellence Post Now</>
                      }
                    </Button>

                    {beResult && (
                      <p className="text-xs text-center pt-1" style={{ color: C.charcoal }}>
                        {beResult}
                      </p>
                    )}

                    <div
                      className="p-3 rounded-2xl text-xs space-y-1"
                      style={{ background: C.ivory, color: C.charcoal }}
                    >
                      <p><strong style={{ color: C.warmBlack }}>Daily cron:</strong> Daily 12pm ET · LinkedIn, Instagram, Threads, TikTok, Facebook, Bluesky (1×)</p>
                      <p><strong style={{ color: C.warmBlack }}>Bluesky slots:</strong> 8× daily · 7am, 9am, 11am, 1pm, 3pm, 5pm, 7pm, 9pm EST · different pillar each slot · 9 posts/day total</p>
                      <p><strong style={{ color: C.warmBlack }}>Wisdom cron:</strong> Daily 9am ET (14:00 UTC) · all socials</p>
                      <p><strong style={{ color: C.warmBlack }}>Black Excellence cron:</strong> Daily 3pm ET (20:00 UTC) · Threads, Bluesky, LinkedIn WVW, Facebook</p>
                      <p><strong style={{ color: C.warmBlack }}>Newsletter cron:</strong> Mon / Wed / Fri 1pm ET (18:00 UTC)</p>
                      <p><strong style={{ color: C.warmBlack }}>Instagram:</strong> carousel posts via Meta API</p>
                      <p><strong style={{ color: C.warmBlack }}>Facebook:</strong> posts directly</p>
                      <p><strong style={{ color: C.warmBlack }}>LinkedIn / Threads / TikTok:</strong> queued via Buffer</p>
                    </div>
                  </CardContent>
                </Card>

                {/* ── Bluesky Spotlight ── */}
                {(() => {
                  const PILLARS = [
                    "Black Mental Health", "Psychological Safety", "Neuroinclusion",
                    "Burnout / Moral Injury", "CHW Structural Care", "CEO / BTS",
                    "Unicorn Wisdoms", "WVW Academy", "Rest as Strategy", "Invisible Labor",
                  ];
                  const PILLAR_COLORS: Record<string, string> = {
                    "Black Mental Health": "#7C3AED", "Psychological Safety": "#059669",
                    "Neuroinclusion": "#D97706", "Burnout / Moral Injury": "#DC2626",
                    "CHW Structural Care": "#0369A1", "CEO / BTS": "#1C3A2A",
                    "Unicorn Wisdoms": "#B8A06A", "WVW Academy": "#4A5E4F",
                    "Rest as Strategy": "#C4A09A", "Invisible Labor": "#6B7280",
                  };
                  const slots = [
                    { slot: 1, time: "7:00 AM", label: "Morning Anchor" },
                    { slot: 2, time: "9:00 AM", label: "Morning Momentum" },
                    { slot: 3, time: "11:00 AM", label: "Late Morning" },
                    { slot: 4, time: "1:00 PM", label: "Midday" },
                    { slot: 5, time: "3:00 PM", label: "Afternoon" },
                    { slot: 6, time: "5:00 PM", label: "End of Day" },
                    { slot: 7, time: "7:00 PM", label: "Evening" },
                    { slot: 8, time: "9:00 PM", label: "Night" },
                  ];
                  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
                  const dayOfYear = Math.floor((Date.now() - start) / 86400000);
                  const nowHour = new Date().getHours();
                  const slotHours = [7, 9, 11, 13, 15, 17, 19, 21];

                  return (
                    <Card className="rounded-3xl shadow-none xl:col-span-3" style={{ background: C.bone, borderColor: "#0085FF33" }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="font-serif text-xl flex items-center gap-2">
                            <span style={{ color: "#0085FF" }}>🦋</span> Bluesky · 9×/day
                          </CardTitle>
                          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#0085FF18", color: "#0085FF" }}>
                            All 7 days · EST
                          </span>
                        </div>
                        <CardDescription style={{ color: C.charcoal }}>
                          Each slot generates a fresh post on a different content pillar. Both WVW + Tiána's personal account post every slot.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {slots.map(({ slot, time, label }) => {
                            const pillar = PILLARS[(dayOfYear + slot) % PILLARS.length];
                            const color = PILLAR_COLORS[pillar] ?? C.charcoal;
                            const isFired = nowHour >= slotHours[slot - 1];
                            const isTriggering = bskySlotTriggering === slot;
                            const result = bskySlotResults[slot];
                            return (
                              <div
                                key={slot}
                                className="rounded-2xl p-3 flex flex-col gap-2"
                                style={{
                                  background: isFired ? C.ivory : C.ivory,
                                  border: `1px solid ${isFired ? color + "44" : "#DDD7CD"}`,
                                  opacity: isFired && !result ? 0.7 : 1,
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.charcoal }}>{time}</span>
                                  {isFired && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: color + "22", color }}>fired</span>}
                                </div>
                                <div>
                                  <p className="text-[11px] font-medium leading-tight" style={{ color: C.warmBlack }}>{label}</p>
                                  <p className="text-[10px] mt-0.5 leading-tight" style={{ color }}>{pillar}</p>
                                </div>
                                <button
                                  onClick={async () => {
                                    setBskySlotTriggering(slot);
                                    try {
                                      const r = await fetch(`/api/cron/bluesky?slot=${slot}`, {
                                        headers: { authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET ?? ""}` },
                                      });
                                      const data = await r.json() as { results?: Record<string, { status: string }> };
                                      const statuses = Object.values(data.results ?? {}).map((v) => v.status);
                                      setBskySlotResults((prev) => ({ ...prev, [slot]: statuses.join(" · ") || (r.ok ? "sent" : "error") }));
                                    } catch {
                                      setBskySlotResults((prev) => ({ ...prev, [slot]: "error" }));
                                    } finally {
                                      setBskySlotTriggering(null);
                                    }
                                  }}
                                  disabled={isTriggering || bskySlotTriggering !== null}
                                  className="w-full text-[10px] font-medium py-1.5 rounded-xl transition-colors"
                                  style={{
                                    background: isTriggering ? color + "22" : color + "15",
                                    color,
                                    border: `1px solid ${color}33`,
                                  }}
                                >
                                  {isTriggering ? "Posting…" : result ? result : "Post Now"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[10px] mt-3" style={{ color: C.charcoal }}>
                          "Fired" = today's scheduled run already completed. "Post Now" fires immediately regardless of schedule.
                          Requires <code className="px-1 rounded" style={{ background: "#DDD7CD" }}>BLUESKY_IDENTIFIER</code> + <code className="px-1 rounded" style={{ background: "#DDD7CD" }}>BLUESKY_APP_PASSWORD</code> in Netlify env vars.
                        </p>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Recent post log */}
                <Card className="rounded-3xl shadow-none xl:col-span-2" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl">Recent Posts</CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>What posted, what failed, and why.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(postingStatus?.recentPosts ?? []).length === 0 ? (
                      <p className="text-sm py-4" style={{ color: C.charcoal }}>
                        No posts logged yet. Click &ldquo;Post Today&apos;s Content Now&rdquo; or wait for the daily cron.
                      </p>
                    ) : (() => {
                      const allEntries = postingStatus?.recentPosts ?? [];
                      const failures = allEntries.filter((e) => e.status === "error" || e.status === "skipped");
                      const posted = allEntries.filter((e) => e.status === "posted" || e.status === "queued");
                      return (
                        <>
                          {failures.length > 0 && (
                            <div className="rounded-2xl border p-3 space-y-2" style={{ borderColor: C.rose + "66", background: C.rose + "11" }}>
                              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.rose }}>Not Posting ({failures.length})</p>
                              {failures.map((entry) => (
                                <div key={entry.id} className="flex items-start gap-3 p-2 rounded-xl" style={{ background: C.ivory }}>
                                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5 font-medium" style={{ background: C.rose + "22", color: C.rose }}>
                                    {entry.status}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-xs font-medium capitalize">{entry.platform.replace(/_/g, " ")}</span>
                                      <span className="text-xs" style={{ color: C.charcoal }}>· {entry.theme}</span>
                                    </div>
                                    {entry.error_detail && (
                                      <p className="text-xs font-medium" style={{ color: C.rose }}>{entry.error_detail}</p>
                                    )}
                                    {entry.excerpt && (
                                      <p className="text-xs truncate mt-0.5" style={{ color: C.charcoal }}>{entry.excerpt}</p>
                                    )}
                                  </div>
                                  <span className="text-xs shrink-0" style={{ color: C.charcoal }}>
                                    {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {posted.length > 0 && (
                            <div className="space-y-2">
                              {failures.length > 0 && <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.forest }}>Successfully Posted ({posted.length})</p>}
                              {posted.map((entry) => (
                                <div key={entry.id} className="p-3 rounded-2xl flex items-start gap-3" style={{ background: C.ivory }}>
                                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5 font-medium" style={{ background: C.forest + "22", color: C.forest }}>
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
                        </>
                      );
                    })()}
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

              {/* ── Strategy Alerts ── */}
              {alerts.length > 0 && (
                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-xl flex items-center gap-2">
                      <Bell className="w-4 h-4" style={{ color: C.forest }} /> Strategy Alerts
                    </CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>Live signals from your post log and lead tracker.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {alerts.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-2xl" style={{
                        background: a.severity === "warning" ? "#FEF3C7" : a.severity === "success" ? C.forest + "11" : C.ivory,
                        border: `1px solid ${a.severity === "warning" ? "#FDE68A" : a.severity === "success" ? C.forest + "33" : "#DDD7CD"}`,
                      }}>
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: a.severity === "warning" ? "#D97706" : a.severity === "success" ? C.forest : C.charcoal }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: C.warmBlack }}>{a.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: C.charcoal }}>{a.body}</p>
                          {a.action && (
                            <div className="flex items-center gap-2 mt-2">
                              {a.type === "pillar_gap" && a.pillar ? (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-6 text-[11px] px-3 rounded-xl"
                                    style={{ background: C.forest, color: C.bone }}
                                    disabled={alertGenerating[i]}
                                    onClick={() => generateFromAlert(i, a.pillar!)}
                                  >
                                    {alertGenerating[i] ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Generating…</> : <><Zap className="w-3 h-3 mr-1" />{a.action.label}</>}
                                  </Button>
                                  {alertGenResult[i] && (
                                    <span className="text-[11px]" style={{ color: alertGenResult[i].startsWith("✓") ? C.forest : C.rose }}>
                                      {alertGenResult[i]}
                                    </span>
                                  )}
                                </>
                              ) : a.action.tab ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[11px] px-3 rounded-xl"
                                  style={{ borderColor: a.severity === "warning" ? "#D97706" : C.forest, color: a.severity === "warning" ? "#D97706" : C.forest }}
                                  onClick={() => setActiveTab(a.action!.tab!)}
                                >
                                  {a.action.label}
                                </Button>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* ── Reddit Signals Preview ── */}
              {!redditLoading && redditSignals.length > 0 && (
                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-serif text-xl flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" style={{ color: C.forest }} /> Top Structural Care Signals
                        </CardTitle>
                        <CardDescription style={{ color: C.charcoal }}>Live from r/burnout, r/ADHD, r/blackmentalhealth, r/humanresources, r/publichealth — what Black workers, CHWs, and neurodivergent staff are talking about right now.</CardDescription>
                      </div>
                      <button
                        className="text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0"
                        style={{ borderColor: C.forest, color: C.forest, background: C.ivory }}
                        onClick={() => setActiveTab("insights")}
                      >
                        View all →
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {redditSignals.slice(0, 3).map((signal, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: C.ivory }}>
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: signal.momentum === "High" ? C.forest : signal.momentum === "Medium" ? C.gold : C.charcoal }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug" style={{ color: C.warmBlack }}>{signal.theme}</p>
                          <p className="text-xs mt-0.5" style={{ color: C.charcoal }}>{signal.source} · {signal.action}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium" style={{ background: signal.momentum === "High" ? C.forest + "22" : C.gold + "33", color: signal.momentum === "High" ? C.forest : C.charcoal }}>{signal.momentum}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* ── Content Queue (Workflow Routing) ── */}
              <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-serif text-xl flex items-center gap-2">
                        <FolderKanban className="w-4 h-4" style={{ color: C.forest }} /> Content Queue
                      </CardTitle>
                      <CardDescription style={{ color: C.charcoal }}>Generate drafts here, review them, then approve to post. Or post immediately above.</CardDescription>
                    </div>
                    <Button
                      size="sm" className="rounded-2xl text-xs shrink-0" style={{ background: C.forest, color: C.bone }}
                      onClick={generateToQueue} disabled={generatingToQueue || selectedPlatforms.length === 0}
                    >
                      {generatingToQueue
                        ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Generating…</>
                        : <><Zap className="w-3.5 h-3.5 mr-1" /> Generate ({selectedPlatforms.length || "0"} platforms)</>}
                    </Button>
                  </div>
                  {queueGenResult && (
                    <p className="text-xs mt-2" style={{ color: queueGenResult.startsWith("✓") ? C.forest : queueGenResult.startsWith("Error") ? C.rose : C.charcoal }}>
                      {queueGenResult}
                    </p>
                  )}
                  {queueError && (
                    <div className="flex items-center gap-2 mt-2 text-xs px-3 py-2 rounded-xl" style={{ background: C.rose + "15", color: C.rose }}>
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Supabase error: {queueError} — check SUPABASE_URL and SUPABASE_ANON_KEY in Vercel env vars.
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {queueLoading ? (
                    <div className="flex items-center gap-2 text-sm py-4" style={{ color: C.charcoal }}><Loader2 className="w-4 h-4 animate-spin" style={{ color: C.forest }} /> Loading queue…</div>
                  ) : queueError ? (
                    <div className="text-center py-8 space-y-2">
                      <p className="text-sm font-medium" style={{ color: C.charcoal }}>Queue unavailable — Supabase not connected.</p>
                      <p className="text-xs" style={{ color: C.charcoal }}>Add your Supabase credentials in Settings to enable the queue.</p>
                    </div>
                  ) : queue.filter((q) => q.status === "draft").length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: C.charcoal }}>
                      No drafts in queue. Click &ldquo;Generate to Queue&rdquo; to create today's content for review.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {queue.filter((q) => q.status === "draft").map((item) => (
                        <div key={item.id} className="p-4 rounded-2xl border space-y-3" style={{ background: C.ivory, borderColor: C.gold + "55" }}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: C.forest + "22", color: C.forest }}>
                                {item.platform.replace(/_/g, " ")}
                              </span>
                              <span className="text-xs" style={{ color: C.charcoal }}>{item.theme}</span>
                            </div>
                            <span className="text-[10px]" style={{ color: C.charcoal }}>
                              {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <textarea
                            value={editingQueue[item.id] ?? item.text}
                            onChange={(e) => setEditingQueue((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            rows={4}
                            className="w-full text-sm rounded-xl px-3 py-2 border resize-none"
                            style={{ background: C.bone, borderColor: "#DDD7CD", color: C.warmBlack }}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm" className="rounded-2xl text-xs" style={{ background: C.forest, color: C.bone }}
                              onClick={() => approveQueueItem(item)} disabled={queuePosting[item.id]}
                            >
                              {queuePosting[item.id] ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Posting…</> : <><Play className="w-3 h-3 mr-1" /> Approve & Post</>}
                            </Button>
                            <Button
                              size="sm" variant="outline" className="rounded-2xl text-xs" style={{ borderColor: C.rose, color: C.rose }}
                              onClick={() => rejectQueueItem(item.id)}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm" variant="outline" className="rounded-2xl text-xs ml-auto" style={{ borderColor: "#DDD7CD", color: C.charcoal }}
                              onClick={() => deleteQueueItem(item.id)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recent posted/rejected items */}
                  {queue.filter((q) => q.status !== "draft").length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      <p className="text-xs font-medium mb-2" style={{ color: C.charcoal }}>History</p>
                      {queue.filter((q) => q.status !== "draft").slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: C.ivory }}>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
                            background: item.status === "posted" ? C.forest + "22" : item.status === "rejected" ? C.rose + "22" : "#DDD7CD",
                            color: item.status === "posted" ? C.forest : item.status === "rejected" ? C.rose : C.charcoal,
                          }}>{item.status}</span>
                          <span className="text-xs font-medium">{item.platform.replace(/_/g, " ")}</span>
                          <span className="text-xs truncate flex-1" style={{ color: C.charcoal }}>{item.text.slice(0, 60)}…</span>
                        </div>
                      ))}
                    </div>
                  )}
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
                      disabled={nlStream.loading || !nlTheme.trim()}
                    >
                      {nlStream.loading
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                        : <><Mail className="w-4 h-4 mr-2" /> Generate Newsletter</>
                      }
                    </Button>
                    <p className="text-xs text-center" style={{ color: C.charcoal }}>Opens in a panel — copy subject, preview, and body directly into Beehiiv.</p>
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
                      disabled={blogStream.loading || !blogTheme.trim()}
                    >
                      {blogStream.loading
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                        : <><BookOpen className="w-4 h-4 mr-2" /> Generate Blog Post</>
                      }
                    </Button>
                    <p className="text-xs text-center" style={{ color: C.charcoal }}>Opens in a panel — copy title, meta description, and full body into GoDaddy.</p>
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
                        disabled={ssStream.loading || !ssTheme.trim()}
                      >
                        {ssStream.loading
                          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                          : <><Globe className="w-4 h-4 mr-2" /> Generate Substack Essay</>
                        }
                      </Button>
                      <p className="text-xs text-center" style={{ color: C.charcoal }}>Opens in a panel — copy title, subtitle, and body directly into Substack.</p>
                    </div>

                    <div
                      className="xl:col-span-2 flex items-center justify-center rounded-2xl p-8 text-sm"
                      style={{ background: C.ivory, color: C.charcoal }}
                    >
                      Enter a theme and click Generate — the full essay will open in a panel.
                    </div>
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
                          setCalSelected(today.toISOString().slice(0, 10));
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
                    const DAYS_OF_WEEK = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"] as const;
                    type DOW = typeof DAYS_OF_WEEK[number];
                    const SCHED: Record<string, DOW[]> = {
                      linkedin_personal: ["Mon","Tue","Wed","Thu","Fri","Sat"],
                      linkedin_wvw:      ["Mon","Tue","Wed","Thu","Fri"],
                      threads:           ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                      bluesky:           ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
                      bluesky_personal:  ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
                      facebook:          ["Mon","Tue","Wed","Thu","Fri"],
                      instagram:         ["Mon","Tue","Wed","Thu","Fri"],
                    };
                    const todayStr = new Date().toISOString().slice(0,10);
                    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
                    const firstDow = new Date(calYear, calMonth - 1, 1).getDay();
                    const byDate: Record<string, typeof calEntries> = {};
                    calEntries.forEach((e) => {
                      if (!byDate[e.date]) byDate[e.date] = [];
                      byDate[e.date].push(e);
                    });
                    // Build scheduled slots for future dates with no logged posts
                    const scheduledByDate: Record<string, string[]> = {};
                    for (let d = 1; d <= daysInMonth; d++) {
                      const dateStr = `${calYear}-${String(calMonth).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                      if (dateStr <= todayStr) continue; // only future
                      if (byDate[dateStr]?.length) continue; // already has real posts
                      const dow = DAYS_OF_WEEK[new Date(dateStr + "T12:00:00").getDay()];
                      const platforms = (Object.keys(SCHED) as string[]).filter((p) => SCHED[p].includes(dow));
                      if (platforms.length > 0) scheduledByDate[dateStr] = platforms;
                    }
                    const PLATFORM_COLORS: Record<string, string> = {
                      linkedin_personal: "#0A66C2",
                      linkedin_wvw: "#0A66C2",
                      facebook: "#1877F2",
                      instagram: "#E1306C",
                      threads: "#6E5DE0",
                      bluesky: "#0085FF",
                      bluesky_personal: "#0085FF",
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
                            const scheduled = scheduledByDate[dateStr] ?? [];
                            const isSelected = calSelected === dateStr;
                            const isToday = dateStr === todayStr;
                            const isFuture = dateStr > todayStr;
                            return (
                              <button
                                key={day}
                                onClick={() => setCalSelected(isSelected ? null : dateStr)}
                                className="rounded-2xl p-2 flex flex-col items-center gap-1 min-h-[52px] transition-colors"
                                style={{
                                  background: isSelected ? C.forest : isToday ? C.gold + "33" : C.ivory,
                                  border: `1px solid ${isSelected ? C.forest : isToday ? C.gold : "#DDD7CD"}`,
                                  opacity: isFuture && !scheduled.length ? 0.5 : 1,
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
                                {entries.length === 0 && scheduled.length > 0 && (
                                  <div className="flex flex-wrap gap-0.5 justify-center">
                                    {scheduled.slice(0, 4).map((p, i) => (
                                      <div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ background: PLATFORM_COLORS[p] ?? C.charcoal, opacity: 0.35 }}
                                        title={`Scheduled: ${p}`}
                                      />
                                    ))}
                                    {scheduled.length > 4 && (
                                      <span className="text-[8px]" style={{ color: isSelected ? C.bone+"99" : C.charcoal+"99" }}>+{scheduled.length - 4}</span>
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
                              scheduledByDate[calSelected]?.length ? (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium" style={{ color: C.charcoal }}>Scheduled platforms</p>
                                  <div className="flex flex-wrap gap-2">
                                    {scheduledByDate[calSelected].map((p) => (
                                      <span key={p} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: C.bone, color: C.charcoal, border: `1px solid #DDD7CD` }}>
                                        {p.replace(/_/g, " ")}
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-xs" style={{ color: C.sage }}>No posts logged yet — cron will post automatically at the scheduled time.</p>
                                </div>
                              ) : (
                                <p className="text-sm" style={{ color: C.charcoal }}>No posts logged for this day.</p>
                              )
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
              {/* ── Lead Attribution (live) ── */}
              {attribution && (attribution.topThemes.length > 0 || attribution.topPlatforms.length > 0) ? (
                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-serif text-xl flex items-center gap-2">
                          <Target className="w-4 h-4" style={{ color: C.forest }} /> Lead Attribution
                        </CardTitle>
                        <CardDescription style={{ color: C.charcoal }}>
                          Which content themes and platforms are driving your leads — based on your real post log and lead tracker.
                        </CardDescription>
                      </div>
                      <div className="flex gap-4 text-center shrink-0">
                        <div><p className="font-serif text-2xl font-semibold">{attribution.totalPosts}</p><p className="text-xs" style={{ color: C.charcoal }}>Posts</p></div>
                        <div><p className="font-serif text-2xl font-semibold">{attribution.totalLeads}</p><p className="text-xs" style={{ color: C.charcoal }}>Leads</p></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium mb-2" style={{ color: C.charcoal }}>By Theme</p>
                        <div className="space-y-2">
                          {attribution.topThemes.slice(0, 6).map((t) => (
                            <div key={t.theme} className="flex items-center gap-3 p-2.5 rounded-2xl" style={{ background: C.ivory }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{t.theme}</p>
                                <p className="text-[10px] mt-0.5" style={{ color: C.charcoal }}>{t.posts} posts · {t.leads} leads · {t.conversions} conversions</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-semibold font-serif" style={{ color: C.forest }}>{t.leads}</p>
                                <p className="text-[10px]" style={{ color: C.charcoal }}>leads</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium mb-2" style={{ color: C.charcoal }}>By Platform</p>
                        <div className="space-y-2">
                          {attribution.topPlatforms.slice(0, 6).map((p) => (
                            <div key={p.platform} className="flex items-center gap-3 p-2.5 rounded-2xl" style={{ background: C.ivory }}>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate capitalize">{p.platform.replace(/_/g, " ")}</p>
                                <p className="text-[10px] mt-0.5" style={{ color: C.charcoal }}>{p.posts} posts</p>
                              </div>
                              <p className="text-sm font-semibold font-serif shrink-0" style={{ color: C.forest }}>{p.leads} leads</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="px-1">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: C.forest + "22", color: C.forest }}>
                    Lead Attribution will populate as you post content and log leads in the Community tab.
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 px-1">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: C.gold + "33", color: C.charcoal }}>AI Insights below use sample posts — connect platform analytics APIs for live data</span>
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
              <div className="flex items-center justify-between px-1">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: C.forest + "22", color: C.forest }}>
                  {leadsLoading ? "Loading…" : `${realLeads.length} interactions · live from Supabase`}
                </span>
                <Button size="sm" className="rounded-2xl text-xs" style={{ background: C.forest, color: C.bone }} onClick={() => setShowLeadForm((v) => !v)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Log a Lead
                </Button>
              </div>

              {showLeadForm && (
                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: C.gold + "66" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Log an Interaction</CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>Track a DM, comment, inquiry, referral, or any high-signal interaction.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs mb-1 font-medium" style={{ color: C.charcoal }}>Platform</p>
                        <select value={leadForm.platform} onChange={(e) => setLeadForm((f) => ({ ...f, platform: e.target.value }))} className="w-full h-9 text-sm rounded-xl px-3 border" style={{ background: C.ivory, borderColor: "#DDD7CD", color: C.warmBlack }}>
                          {["LinkedIn Personal","LinkedIn WVW","Instagram","TikTok","Threads","Facebook","Bluesky","Newsletter","Podcast"].map((p) => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="text-xs mb-1 font-medium" style={{ color: C.charcoal }}>Interaction Type</p>
                        <select value={leadForm.interaction_type} onChange={(e) => setLeadForm((f) => ({ ...f, interaction_type: e.target.value }))} className="w-full h-9 text-sm rounded-xl px-3 border" style={{ background: C.ivory, borderColor: "#DDD7CD", color: C.warmBlack }}>
                          {["Inquiry","DM","Comment","Collaboration","Testimonial","Referral","Newsletter Reply","Podcast Listener Message"].map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="text-xs mb-1 font-medium" style={{ color: C.charcoal }}>Name / Handle</p>
                        <Input value={leadForm.user_name} onChange={(e) => setLeadForm((f) => ({ ...f, user_name: e.target.value }))} placeholder="e.g. Marcus T. or @handle" className="h-9 text-sm rounded-xl" style={{ background: C.ivory, borderColor: "#DDD7CD" }} />
                      </div>
                      <div>
                        <p className="text-xs mb-1 font-medium" style={{ color: C.charcoal }}>Follow-Up Status</p>
                        <select value={leadForm.follow_up_status} onChange={(e) => setLeadForm((f) => ({ ...f, follow_up_status: e.target.value }))} className="w-full h-9 text-sm rounded-xl px-3 border" style={{ background: C.ivory, borderColor: "#DDD7CD", color: C.warmBlack }}>
                          {["New","Needs Response","Responded","Warm Lead","Booked Call","Closed","Not a Fit"].map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs mb-1 font-medium" style={{ color: C.charcoal }}>What did they say? (summary)</p>
                      <textarea value={leadForm.message_summary} onChange={(e) => setLeadForm((f) => ({ ...f, message_summary: e.target.value }))} rows={2} placeholder="e.g. Asking about organizational consulting for their nonprofit…" className="w-full text-sm rounded-xl px-3 py-2 border resize-none" style={{ background: C.ivory, borderColor: "#DDD7CD", color: C.warmBlack }} />
                    </div>
                    <div>
                      <p className="text-xs mb-1 font-medium" style={{ color: C.charcoal }}>Notes (optional)</p>
                      <Input value={leadForm.notes} onChange={(e) => setLeadForm((f) => ({ ...f, notes: e.target.value }))} placeholder="e.g. VP-level, follow up with deck" className="h-9 text-sm rounded-xl" style={{ background: C.ivory, borderColor: "#DDD7CD" }} />
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: C.charcoal }}>
                        <input type="checkbox" checked={leadForm.lead_flag} onChange={(e) => setLeadForm((f) => ({ ...f, lead_flag: e.target.checked }))} />
                        Mark as Lead
                      </label>
                      <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: C.charcoal }}>
                        <input type="checkbox" checked={leadForm.follow_up_needed} onChange={(e) => setLeadForm((f) => ({ ...f, follow_up_needed: e.target.checked }))} />
                        Follow-Up Needed
                      </label>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button className="rounded-2xl text-sm" style={{ background: C.forest, color: C.bone }} onClick={submitLead} disabled={leadSaving || !leadForm.user_name.trim() || !leadForm.message_summary.trim()}>
                        {leadSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Interaction"}
                      </Button>
                      <Button variant="outline" className="rounded-2xl text-sm" style={{ borderColor: "#DDD7CD" }} onClick={() => setShowLeadForm(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <CommunityLeads interactions={realLeads} />
            </TabsContent>

            {/* ── Conversions ── */}
            <TabsContent value="conversions" className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: C.forest + "22", color: C.forest }}>
                  {realConversions.length > 0 ? `${realConversions.length} conversions logged · live from Supabase` : "Log your real consultations, speaking gigs, and client conversions here"}
                </span>
                <Button size="sm" className="rounded-2xl text-xs" style={{ background: C.forest, color: C.bone }} onClick={() => setShowConversionForm((v) => !v)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Log Conversion
                </Button>
              </div>

              {showConversionForm && (
                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: C.gold + "66" }}>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Log a Conversion</CardTitle>
                    <CardDescription style={{ color: C.charcoal }}>Track a consultation, discovery call, speaking engagement, or any business outcome.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs mb-1 font-medium" style={{ color: C.charcoal }}>Source Platform</p>
                        <select value={conversionForm.source_platform} onChange={(e) => setConversionForm((f) => ({ ...f, source_platform: e.target.value }))} className="w-full h-9 text-sm rounded-xl px-3 border" style={{ background: C.ivory, borderColor: "#DDD7CD", color: C.warmBlack }}>
                          {["LinkedIn Personal","LinkedIn WVW","Instagram","TikTok","Threads","Facebook","Bluesky","Newsletter","Podcast","Referral","Direct"].map((p) => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="text-xs mb-1 font-medium" style={{ color: C.charcoal }}>Conversion Type</p>
                        <select value={conversionForm.conversion_type} onChange={(e) => setConversionForm((f) => ({ ...f, conversion_type: e.target.value }))} className="w-full h-9 text-sm rounded-xl px-3 border" style={{ background: C.ivory, borderColor: "#DDD7CD", color: C.warmBlack }}>
                          {["Consultation Inquiry","Discovery Call","Consulting Engagement","Speaking Opportunity","Workshop","WVW Academy Signup","Newsletter Signup","Partnership","Referral","Other"].map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="text-xs mb-1 font-medium" style={{ color: C.charcoal }}>Status</p>
                        <select value={conversionForm.status} onChange={(e) => setConversionForm((f) => ({ ...f, status: e.target.value }))} className="w-full h-9 text-sm rounded-xl px-3 border" style={{ background: C.ivory, borderColor: "#DDD7CD", color: C.warmBlack }}>
                          {["New","In Progress","Converted","Lost","Nurture"].map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="text-xs mb-1 font-medium" style={{ color: C.charcoal }}>Value (USD, optional)</p>
                        <Input type="number" min={0} value={conversionForm.value_usd} onChange={(e) => setConversionForm((f) => ({ ...f, value_usd: Math.max(0, Number(e.target.value)) }))} placeholder="e.g. 4500" className="h-9 text-sm rounded-xl" style={{ background: C.ivory, borderColor: "#DDD7CD" }} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs mb-1 font-medium" style={{ color: C.charcoal }}>Description</p>
                      <textarea value={conversionForm.description} onChange={(e) => setConversionForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="e.g. 3-month org consulting engagement for nonprofit, 200 employees…" className="w-full text-sm rounded-xl px-3 py-2 border resize-none" style={{ background: C.ivory, borderColor: "#DDD7CD", color: C.warmBlack }} />
                    </div>
                    <div>
                      <p className="text-xs mb-1 font-medium" style={{ color: C.charcoal }}>Notes (optional)</p>
                      <Input value={conversionForm.notes} onChange={(e) => setConversionForm((f) => ({ ...f, notes: e.target.value }))} placeholder="e.g. referred by Marcus T., call scheduled May 15" className="h-9 text-sm rounded-xl" style={{ background: C.ivory, borderColor: "#DDD7CD" }} />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button className="rounded-2xl text-sm" style={{ background: C.forest, color: C.bone }} onClick={submitConversion} disabled={conversionSaving || !conversionForm.description.trim()}>
                        {conversionSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Conversion"}
                      </Button>
                      <Button variant="outline" className="rounded-2xl text-sm" style={{ borderColor: "#DDD7CD" }} onClick={() => setShowConversionForm(false)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {realConversions.length > 0 && (
                <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-serif text-xl">Your Conversions</CardTitle>
                      <div className="text-right">
                        <p className="font-serif text-2xl font-semibold" style={{ color: C.forest }}>
                          ${realConversions.reduce((s, c) => s + (c.value_usd ?? 0), 0).toLocaleString()}
                        </p>
                        <p className="text-xs" style={{ color: C.charcoal }}>total value logged</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {realConversions.map((c) => (
                        <div key={c.id} className="p-3 rounded-2xl border flex items-start gap-3" style={{ background: C.ivory, borderColor: "#DDD7CD" }}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium">{c.conversion_type}</span>
                              <span className="text-xs" style={{ color: C.charcoal }}>· {c.source_platform}</span>
                            </div>
                            <p className="text-xs" style={{ color: C.charcoal }}>{c.description}</p>
                            {c.notes && <p className="text-[11px] mt-1 italic" style={{ color: C.sage }}>{c.notes}</p>}
                          </div>
                          <div className="text-right shrink-0 space-y-1">
                            <span className="text-xs px-2 py-0.5 rounded-full block" style={{ background: c.status === "Converted" ? C.forest + "22" : c.status === "Lost" ? C.rose + "22" : C.gold + "33", color: c.status === "Converted" ? C.forest : c.status === "Lost" ? C.rose : C.charcoal }}>{c.status}</span>
                            {c.value_usd > 0 && <p className="text-xs font-semibold" style={{ color: C.forest }}>${c.value_usd.toLocaleString()}</p>}
                            <p className="text-[10px]" style={{ color: C.charcoal }}>{new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center gap-2 px-1">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: C.gold + "33", color: C.charcoal }}>Sample conversion funnel shown below — your real data appears above</span>
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
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: C.gold + "33", color: C.charcoal }}>Community leads are live. Engagement metrics (reach, saves) require platform API access.</span>
              </div>
              {(() => {
                const loggedPosts = (postingStatus?.recentPosts ?? []).filter((p) => p.status === "posted");
                const hasRealPostData = loggedPosts.length > 0;
                const postsForReports = hasRealPostData
                  ? loggedPosts.map((p) => ({
                      id: p.id,
                      title: p.theme,
                      platform: p.platform as import("@/types/dashboard").Platform,
                      contentType: "Short-form video" as import("@/types/dashboard").ContentType,
                      topicCategory: p.theme as import("@/types/dashboard").TopicCategory,
                      hookType: "Question" as import("@/types/dashboard").HookType,
                      tone: "Grounded",
                      ctaType: "Reflect",
                      datePosted: p.timestamp.slice(0, 10),
                      timePosted: p.timestamp.slice(11, 16),
                      reach: 0, impressions: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0,
                      engagementRate: 0,
                      conversionFlag: false,
                      status: "Published" as import("@/types/dashboard").PostStatus,
                    }))
                  : samplePosts;
                return (
                  <ReportsSection
                    posts={postsForReports}
                    conversions={realConversions.length > 0
                      ? realConversions.map((c) => ({
                          id: c.id, date: c.date, sourcePlatform: c.source_platform as import("@/types/dashboard").Platform,
                          conversionType: c.conversion_type as import("@/types/dashboard").ConversionType, description: c.description,
                          conversionValue: c.value_usd, status: c.status as import("@/types/dashboard").ConversionStatus, notes: c.notes,
                        }))
                      : sampleConversions}
                    interactions={realLeads}
                    hasRealData={hasRealPostData}
                  />
                );
              })()}
            </TabsContent>

            {/* ── Settings ── */}
            <TabsContent value="settings" className="space-y-4">

              {/* ── Update Your Stats ── */}
              <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-serif text-xl">Update Your Stats</CardTitle>
                      <CardDescription style={{ color: C.charcoal }}>
                        Enter your real follower counts, engagement rates, and CTR per platform. Saves to Supabase — persists across sessions.
                        {statsLastUpdated && <span className="ml-2 text-[11px]">Last updated: {new Date(statsLastUpdated).toLocaleDateString()}</span>}
                      </CardDescription>
                    </div>
                    {!statsEditing && (
                      <Button size="sm" variant="outline" className="rounded-2xl text-xs shrink-0" style={{ borderColor: C.forest, color: C.forest }}
                        onClick={() => { setStatsDraft(activeSummary.map((r) => ({ platform: r.platform, followers: r.followers, engagement: r.engagement, ctr: r.ctr, posts: r.posts, lead_score: r.leadScore, updated_at: null }))); setStatsEditing(true); }}>
                        Edit Stats
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {statsEditing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-6 gap-2 text-xs font-medium px-2" style={{ color: C.charcoal }}>
                        <span className="col-span-2">Platform</span><span>Followers</span><span>Eng %</span><span>CTR %</span><span>Posts</span>
                      </div>
                      {statsDraft.map((row, i) => (
                        <div key={row.platform} className="grid grid-cols-6 gap-2 items-center p-2 rounded-xl" style={{ background: C.ivory }}>
                          <span className="col-span-2 text-xs font-medium" style={{ color: C.warmBlack }}>{row.platform}</span>
                          <input type="number" value={row.followers} onChange={(e) => setStatsDraft((d) => d.map((r, j) => j === i ? { ...r, followers: Number(e.target.value) } : r))} className="h-7 text-xs rounded-lg px-2 border w-full" style={{ background: C.bone, borderColor: "#DDD7CD" }} />
                          <input type="number" step="0.1" value={row.engagement} onChange={(e) => setStatsDraft((d) => d.map((r, j) => j === i ? { ...r, engagement: Number(e.target.value) } : r))} className="h-7 text-xs rounded-lg px-2 border w-full" style={{ background: C.bone, borderColor: "#DDD7CD" }} />
                          <input type="number" step="0.1" value={row.ctr} onChange={(e) => setStatsDraft((d) => d.map((r, j) => j === i ? { ...r, ctr: Number(e.target.value) } : r))} className="h-7 text-xs rounded-lg px-2 border w-full" style={{ background: C.bone, borderColor: "#DDD7CD" }} />
                          <input type="number" value={row.posts} onChange={(e) => setStatsDraft((d) => d.map((r, j) => j === i ? { ...r, posts: Number(e.target.value) } : r))} className="h-7 text-xs rounded-lg px-2 border w-full" style={{ background: C.bone, borderColor: "#DDD7CD" }} />
                        </div>
                      ))}
                      <div className="flex gap-2 pt-1">
                        <Button className="rounded-2xl text-sm" style={{ background: C.forest, color: C.bone }} onClick={saveStats} disabled={statsSaving}>
                          {statsSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Stats"}
                        </Button>
                        <Button variant="outline" className="rounded-2xl text-sm" style={{ borderColor: "#DDD7CD" }} onClick={() => setStatsEditing(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b" style={{ borderColor: "#DDD7CD" }}>
                            {["Platform","Followers","Eng %","CTR %","Posts / Mo","Lead Score"].map((h) => (
                              <th key={h} className="pb-2 pr-4 text-xs font-medium" style={{ color: C.charcoal }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeSummary.map((row) => (
                            <tr key={row.platform} className="border-b last:border-0" style={{ borderColor: "#DDD7CD" }}>
                              <td className="py-2 pr-4 text-sm font-medium">{row.platform}</td>
                              <td className="pr-4 text-sm" style={{ color: row.followers === 0 ? C.charcoal+"66" : C.charcoal }}>{row.followers === 0 ? "—" : row.followers.toLocaleString()}</td>
                              <td className="pr-4 text-sm" style={{ color: C.charcoal }}>{row.engagement === 0 ? "—" : `${row.engagement}%`}</td>
                              <td className="pr-4 text-sm" style={{ color: C.charcoal }}>{row.ctr === 0 ? "—" : `${row.ctr}%`}</td>
                              <td className="pr-4 text-sm" style={{ color: C.charcoal }}>{row.posts === 0 ? "—" : row.posts}</td>
                              <td className="text-sm font-medium" style={{ color: C.forest }}>{row.leadScore === 0 ? "—" : row.leadScore}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!statsHaveData && <p className="text-xs mt-3 text-center" style={{ color: C.charcoal }}>No stats yet — click Edit Stats to enter your real numbers.</p>}
                    </div>
                  )}
                </CardContent>
              </Card>

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
                      platform: "LinkedIn Personal + WVW (via Buffer)",
                      testKeys: ["linkedin_personal", "linkedin_wvw"] as string[],
                      keys: ["BUFFER_ACCESS_TOKEN", "BUFFER_PROFILE_LINKEDIN_PERSONAL", "BUFFER_PROFILE_LINKEDIN_WVW"],
                      postStatus: postingStatus?.connections.linkedin_personal_buffer && postingStatus?.connections.linkedin_wvw_buffer,
                      note: "Connect both LinkedIn accounts as channels in Buffer, then get their profile IDs from https://api.buffer.com/1/profiles.json?access_token=YOUR_TOKEN",
                      analyticsNote: "Buffer's classic API does not expose LinkedIn follower/engagement analytics",
                      reAuthUrl: "https://publish.buffer.com/channels",
                    },
                    {
                      platform: "Bluesky WVW + Personal",
                      testKeys: ["bluesky", "bluesky_personal"] as string[],
                      keys: ["BLUESKY_IDENTIFIER", "BLUESKY_APP_PASSWORD", "BLUESKY_PERSONAL_IDENTIFIER", "BLUESKY_PERSONAL_APP_PASSWORD"],
                      postStatus: postingStatus?.connections.bluesky && postingStatus?.connections.bluesky_personal,
                      note: "App passwords never expire — generate at bsky.app → Settings → App Passwords",
                      analyticsNote: "No analytics API yet — Bluesky protocol still building this",
                    },
                    {
                      platform: "Facebook WVW Page",
                      testKeys: [] as string[],
                      keys: ["FACEBOOK_PAGE_ACCESS_TOKEN", "FACEBOOK_PAGE_ID"],
                      postStatus: postingStatus?.connections.facebook,
                      note: "Current token is missing pages_manage_posts + pages_read_engagement permissions. Go to developers.facebook.com → Graph API Explorer → select your Page → generate token with those two scopes → exchange for long-lived token.",
                      analyticsNote: "pages_read_engagement scope required for reach + follower data",
                    },
                    {
                      platform: "Instagram Business",
                      testKeys: [] as string[],
                      keys: ["INSTAGRAM_BUSINESS_ACCOUNT_ID"],
                      postStatus: postingStatus?.connections.instagram,
                      note: "Uses same FACEBOOK_PAGE_ACCESS_TOKEN — account must be Business type",
                      analyticsNote: "Add instagram_manage_insights scope for impressions + reach",
                    },
                    {
                      platform: "Threads (via Buffer)",
                      testKeys: ["threads"] as string[],
                      keys: ["BUFFER_ACCESS_TOKEN", "BUFFER_PROFILE_THREADS"],
                      postStatus: postingStatus?.connections.threads_buffer,
                      note: "Connect Threads as a channel in Buffer, then get its profile ID from https://api.buffer.com/1/profiles.json?access_token=YOUR_TOKEN",
                      analyticsNote: "Buffer's classic API does not expose Threads analytics",
                      reAuthUrl: "https://publish.buffer.com/channels",
                    },
                    {
                      platform: "TikTok (via Buffer)",
                      testKeys: [] as string[],
                      keys: ["BUFFER_ACCESS_TOKEN", "BUFFER_PROFILE_TIKTOK"],
                      postStatus: postingStatus?.connections.tiktok_buffer,
                      note: "Connect TikTok to Buffer → get API token at buffer.com/developers",
                      analyticsNote: "TikTok analytics available via TikTok Business API (separate setup)",
                    },
                    {
                      platform: "Supabase (post log + calendar + blog)",
                      testKeys: [] as string[],
                      keys: ["SUPABASE_URL", "SUPABASE_ANON_KEY"],
                      postStatus: !!(postingStatus?.recentPosts !== undefined),
                      note: "Project: xsrcvtpbrhuiymxyxwkf — get keys at supabase.com → project → Settings → API",
                      analyticsNote: "Required for calendar, recent post log, and blog publishing to work",
                    },
                    {
                      platform: "Structural Care Signals (Trends tab)",
                      testKeys: [] as string[],
                      keys: [] as string[],
                      postStatus: true,
                      note: "Uses Reddit's public JSON API — no credentials required. Pulls live signals from r/burnout, r/ADHD, r/blackmentalhealth, r/humanresources, r/nonprofit, r/publichealth, r/socialwork (CHW/frontline), and more. Also feeds the top daily signal directly into automated post generation. View signals in the Trends tab.",
                      analyticsNote: "No API key needed — Reddit public feed is always live",
                    },
                    {
                      platform: "Beehiiv (Newsletter)",
                      testKeys: [] as string[],
                      keys: ["BEEHIIV_API_KEY", "BEEHIIV_PUBLICATION_ID"],
                      postStatus: false,
                      note: "Optional — newsletter still generates without this. Add to auto-publish drafts to Beehiiv. Get API key at app.beehiiv.com → Settings → API.",
                      analyticsNote: "Required to auto-create Beehiiv drafts from the Publish tab",
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
                        {"reAuthUrl" in item && item.reAuthUrl && (
                          <div className="pt-1">
                            <Button
                              size="sm"
                              className="rounded-xl text-[11px] h-7 px-3"
                              style={{ background: C.rose + "22", color: C.rose, border: `1px solid ${C.rose}44` }}
                              onClick={() => window.open(item.reAuthUrl as string, "_blank")}
                            >
                              🔄 Re-connect {item.platform.split(" ")[0]}
                            </Button>
                            <p className="text-[10px] mt-1" style={{ color: C.charcoal }}>Opens OAuth flow → copy new token → update in Vercel env vars → redeploy</p>
                          </div>
                        )}
                        {item.testKeys.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {item.testKeys.map((tk) => {
                              const res = testResults[tk];
                              const busy = testPosting[tk];
                              return (
                                <div key={tk} className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl text-[11px] h-7 px-3"
                                    style={{ borderColor: C.forest, color: C.forest }}
                                    disabled={busy}
                                    onClick={() => sendTestPost(tk)}
                                  >
                                    {busy ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Testing…</> : `Test ${tk.replace("_", " ")}`}
                                  </Button>
                                  {res && (
                                    <span className="text-[11px]" style={{
                                      color: res.status === "posted" ? C.forest : res.status === "skipped" ? C.sage : C.rose,
                                    }}>
                                      {res.status === "posted" ? "✓ posted" : res.status === "skipped" ? `skipped: ${res.reason}` : `✗ ${res.error}`}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
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
                    { section: "Calendar", what: "Live — posts appear after each cron run (12pm ET daily)" },
                    { section: "Recent Posts log", what: "Live — last 15 posts tracked in Supabase post_log" },
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

            {/* ── Website Analytics ── */}
            <TabsContent value="website" className="space-y-4">
              <WebsiteAnalytics />
              <hr style={{ borderColor: '#DDD7CD', opacity: 0.6 }} />
              <AssessmentResults />
            </TabsContent>

          </Tabs>

          {/* ── Layer 2 feature cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                icon: Link2,
                title: "Live Integrations",
                text: "LinkedIn, Threads, Bluesky, Facebook, Beehiiv connected. Add Instagram and TikTok in Settings.",
                tab: "settings",
                action: "Manage Connections",
                live: true,
              },
              {
                icon: FolderKanban,
                title: "Content Queue",
                text: `${queue.filter((q) => q.status === "draft").length} draft${queue.filter((q) => q.status === "draft").length !== 1 ? "s" : ""} waiting for approval. Generate, review, and approve before posting.`,
                tab: "autopost",
                action: "Open Queue",
                live: true,
              },
              {
                icon: Target,
                title: "Lead Attribution",
                text: attribution
                  ? `${attribution.totalPosts} posts · ${attribution.totalLeads} leads tracked. See which themes drive business.`
                  : "Log leads in Community tab to see which content themes drive business.",
                tab: "intelligence",
                action: "View Attribution",
                live: !!attribution,
              },
              {
                icon: Lightbulb,
                title: "Strategy Alerts",
                text: alerts.length > 0
                  ? `${alerts.filter((a) => a.severity === "warning").length} warning${alerts.filter((a) => a.severity === "warning").length !== 1 ? "s" : ""} · ${alerts.filter((a) => a.severity === "success").length} positive signal${alerts.filter((a) => a.severity === "success").length !== 1 ? "s" : ""} from your post log.`
                  : "Pillar gap detection and lead spike alerts based on your real post log.",
                tab: "autopost",
                action: "View Alerts",
                live: alerts.length > 0,
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={STAGGER(i)}
                whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(28,58,42,0.12)" }}
                whileTap={{ scale: 0.97 }}
                style={{ cursor: "pointer" }}
                onClick={() => setActiveTab(card.tab)}
              >
                <Card
                  className="rounded-3xl shadow-none h-full"
                  style={{ background: C.bone, borderColor: card.live ? C.forest + "44" : "#DDD7CD" }}
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-3 rounded-2xl" style={{ background: card.live ? C.forest + "11" : C.ivory }}>
                        <card.icon className="w-4 h-4" style={{ color: C.forest }} />
                      </div>
                      {card.live && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: C.forest + "22", color: C.forest }}>Live</span>
                      )}
                    </div>
                    <h3 className="font-serif text-base font-semibold">{card.title}</h3>
                    <p className="text-sm" style={{ color: C.charcoal }}>{card.text}</p>
                    <p className="text-xs font-medium" style={{ color: C.forest }}>→ {card.action}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* ── CTA banner ── */}
          <Card
            className="rounded-3xl overflow-hidden"
            style={{ background: C.forest, border: "none" }}
          >
            <CardContent className="p-6 md:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: C.gold }}>Platform status</p>
                <h2 className="font-serif text-2xl md:text-3xl font-semibold" style={{ color: C.bone }}>
                  Your command center is live and posting.
                </h2>
                <p className="mt-2 max-w-2xl text-sm" style={{ color: C.bone + "cc" }}>
                  LinkedIn, Threads, Bluesky, and Facebook are connected. Unicorn Wisdoms post daily at 9am ET. Content cron runs at 12pm ET. Add Instagram and TikTok credentials in Settings to expand your reach.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Button
                  className="rounded-2xl"
                  style={{ background: C.gold, color: C.warmBlack }}
                  onClick={() => setActiveTab("settings")}
                >
                  <Sparkles className="w-4 h-4 mr-2" /> View Settings
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  style={{ borderColor: C.bone + "66", color: C.bone }}
                  onClick={() => setActiveTab("autopost")}
                >
                  <BarChart3 className="w-4 h-4 mr-2" /> Auto-Post Queue
                </Button>
              </div>
            </CardContent>
          </Card>

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
