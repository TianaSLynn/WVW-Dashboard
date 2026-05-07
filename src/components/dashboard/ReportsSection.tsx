"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Download, ChevronRight } from "lucide-react";
import type { ContentPost, Conversion, CommunityInteraction } from "@/types/dashboard";
import { calcEngagementRate, topPerformingPlatform, revenueByPlatform } from "@/utils/calculations";
import { generateInsights } from "@/utils/recommendations";

const C = { forest:"#1C3A2A", bone:"#F5F0E8", rose:"#C4A09A", gold:"#B8A06A", charcoal:"#3D3935", sage:"#4A5E4F", ivory:"#F9F5ED", warmBlack:"#1A1714" };

interface Report {
  id: string;
  title: string;
  description: string;
  summary: string;
  metrics: { label: string; value: string }[];
  findings: string[];
  nextSteps: string[];
}

interface Props {
  posts: ContentPost[];
  conversions: Conversion[];
  interactions: CommunityInteraction[];
}

export default function ReportsSection({ posts, conversions, interactions }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const avgEng = posts.length ? posts.reduce((s, p) => s + calcEngagementRate(p), 0) / posts.length : 0;
  const topPlat = topPerformingPlatform(posts);
  const totalRevenue = conversions.reduce((s, c) => s + c.conversionValue, 0);
  const totalReach = posts.reduce((s, p) => s + p.reach, 0);
  const insights = generateInsights(posts);
  const revByPlat = revenueByPlatform(conversions);
  const topRevPlat = Object.entries(revByPlat).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? "—";
  const leads = interactions.filter((i) => i.leadFlag).length;

  const reports: Report[] = [
    {
      id: "weekly",
      title: "Weekly Content Performance",
      description: "Post-by-post breakdown for the current week.",
      summary: `${posts.slice(0,3).length} posts published this period. Average engagement rate of ${avgEng.toFixed(1)}%. ${topPlat} leading platform performance.`,
      metrics: [
        { label: "Posts Published",   value: String(posts.length) },
        { label: "Total Reach",        value: totalReach.toLocaleString() },
        { label: "Avg Engagement",    value: `${avgEng.toFixed(1)}%` },
        { label: "Conversion Posts",  value: String(posts.filter(p=>p.conversionFlag).length) },
      ],
      findings: [insights[0] ?? "—", insights[1] ?? "—", insights[2] ?? "—"],
      nextSteps: ["Repurpose top 3 highest-save posts into newsletter segments.", "Increase LinkedIn Personal posting frequency by 1 post/week.", "Review and archive underperforming content."],
    },
    {
      id: "growth",
      title: "Monthly Growth Report",
      description: "Follower growth, engagement trends, and audience expansion.",
      summary: `Platform reach growing with strongest momentum on TikTok and LinkedIn Personal. Audience behavior signals indicate high intent from HR and nonprofit leadership segments.`,
      metrics: [
        { label: "Total Impressions",  value: posts.reduce((s,p)=>s+p.impressions,0).toLocaleString() },
        { label: "Total Saves",        value: posts.reduce((s,p)=>s+p.saves,0).toLocaleString() },
        { label: "Total Shares",       value: posts.reduce((s,p)=>s+p.shares,0).toLocaleString() },
        { label: "Total Comments",     value: posts.reduce((s,p)=>s+p.comments,0).toLocaleString() },
      ],
      findings: ["TikTok audience engagement is disproportionately high relative to follower count.", "LinkedIn saves correlate with consultation inquiry rate.", "Instagram saves peaking on burnout and self-care content."],
      nextSteps: ["Optimize posting cadence for TikTok evenings (7–9pm).", "Test LinkedIn newsletter as supplemental distribution channel.", "Track audience location data to identify geographic expansion opportunities."],
    },
    {
      id: "platform",
      title: "Platform Comparison Report",
      description: "Side-by-side performance and ROI by platform.",
      summary: `${topPlat} leads in engagement. LinkedIn Personal delivers highest conversion rate per post. TikTok delivers highest raw reach volume.`,
      metrics: [
        { label: "Top Platform (Engagement)", value: topPlat },
        { label: "Top Platform (Revenue)",    value: topRevPlat },
        { label: "Platforms Active",          value: String(new Set(posts.map(p=>p.platform)).size) },
        { label: "Cross-Platform Posts",      value: String(posts.length) },
      ],
      findings: ["LinkedIn Personal has 3x the conversion rate of LinkedIn WVW Page.", "TikTok controversy hooks drive highest watch time completion.", "Threads performs well for thought leadership but low conversion signal."],
      nextSteps: ["Shift WVW Page strategy toward LinkedIn newsletters and company updates.", "Increase TikTok posting from 2x to 3x/week based on engagement ROI.", "Test Threads for community-building rather than conversion content."],
    },
    {
      id: "conversion",
      title: "Conversion Report",
      description: "Revenue connected to content, pipeline status, and lead velocity.",
      summary: `Total pipeline value of $${totalRevenue.toLocaleString()} tracked across ${conversions.length} conversion events. ${leads} active leads in the community tracker.`,
      metrics: [
        { label: "Pipeline Value",   value: `$${totalRevenue.toLocaleString()}` },
        { label: "Conversions",      value: String(conversions.filter(c=>c.status==="Converted").length) },
        { label: "Active Leads",     value: String(leads) },
        { label: "Top Source",       value: topRevPlat },
      ],
      findings: ["LinkedIn Personal content generates highest-value consultation leads.", "Newsletter content converts at a higher rate than social content.", "Consultation inquiries cluster around psychological safety and burnout topics."],
      nextSteps: ["Add direct CTA to all burnout and psychological safety posts.", "Build a dedicated consultation landing page.", "Develop a lead nurture email sequence for warm leads."],
    },
    {
      id: "audience",
      title: "Audience Insight Report",
      description: "Behavioral patterns, pain points, and engagement profiles.",
      summary: `Audience segments heavily represented by HR directors, nonprofit leaders, and Black professionals experiencing burnout. Strong DM-to-lead conversion signal.`,
      metrics: [
        { label: "Platforms Analyzed", value: "8" },
        { label: "Lead Interactions",  value: String(leads) },
        { label: "Top Behavior",       value: "Engager / Lead" },
        { label: "Peak Active Time",   value: "Tue–Thu 8–10am" },
      ],
      findings: ["HR directors save and share psychological safety content at the highest rate.", "TikTok audience skews younger but generates meaningful DM inquiry.", "Newsletter audience has highest purchase intent based on reply behavior."],
      nextSteps: ["Create a lead magnet targeted at HR directors.", "Develop a burnout resource guide for opt-in capture.", "Build a community space for returning audience members."],
    },
    {
      id: "repurpose",
      title: "Repurposing Opportunity Report",
      description: "Top candidates for cross-platform repurposing.",
      summary: `${posts.filter(p=>p.saves>200).length} posts have high save rates indicating strong repurpose potential. Burnout and neurodivergence content clusters are highest priority.`,
      metrics: [
        { label: "High Save Posts",    value: String(posts.filter(p=>p.saves>200).length) },
        { label: "High Share Posts",   value: String(posts.filter(p=>p.shares>100).length) },
        { label: "Conversion Posts",   value: String(posts.filter(p=>p.conversionFlag).length) },
        { label: "Podcast Candidates", value: String(posts.filter(p=>p.comments>80).length) },
      ],
      findings: ["Top 3 reels should become carousels for Instagram and LinkedIn.", "Burnout thread content should anchor the next newsletter series.", "ADHD at Work content has podcast expansion potential based on listener messages."],
      nextSteps: ["Create carousel series from top 5 save posts.", "Draft newsletter content from 'Quiet Grief of High-Functioning Burnout'.", "Pitch 'ADHD at Work' as podcast mini-series to audience."],
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm" style={{ color: C.charcoal }}>Click any report to expand the full strategic brief.</p>
      {reports.map((report) => {
        const isOpen = open === report.id;
        return (
          <Card key={report.id} className="rounded-3xl shadow-none overflow-hidden" style={{ background: C.bone, borderColor: "#DDD7CD" }}>
            <div
              className="flex items-center justify-between p-5 cursor-pointer"
              onClick={() => setOpen(isOpen ? null : report.id)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: C.ivory }}>
                  <FileText className="w-4 h-4" style={{ color: C.forest }} />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold" style={{ color: C.warmBlack }}>{report.title}</h3>
                  <p className="text-xs" style={{ color: C.charcoal }}>{report.description}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 transition-transform shrink-0" style={{ color: C.charcoal, transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }} />
            </div>

            {isOpen && (
              <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: "#DDD7CD" }}>
                <div className="pt-4 p-4 rounded-2xl" style={{ background: C.ivory }}>
                  <p className="text-xs font-medium mb-1" style={{ color: C.charcoal }}>EXECUTIVE SUMMARY</p>
                  <p className="text-sm leading-relaxed" style={{ color: C.warmBlack }}>{report.summary}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {report.metrics.map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-2xl" style={{ background: C.ivory }}>
                      <p className="text-[10px] font-medium mb-0.5" style={{ color: C.charcoal }}>{label}</p>
                      <p className="text-sm font-semibold font-serif" style={{ color: C.warmBlack }}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium mb-2" style={{ color: C.charcoal }}>STRATEGIC FINDINGS</p>
                    <div className="space-y-2">
                      {report.findings.map((f, i) => (
                        <div key={i} className="flex gap-2 p-3 rounded-xl" style={{ background: C.ivory }}>
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: C.forest }} />
                          <p className="text-xs" style={{ color: C.charcoal }}>{f}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-2" style={{ color: C.charcoal }}>RECOMMENDED NEXT STEPS</p>
                    <div className="space-y-2">
                      {report.nextSteps.map((s, i) => (
                        <div key={i} className="flex gap-2 p-3 rounded-xl" style={{ background: C.ivory }}>
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: C.gold }} />
                          <p className="text-xs" style={{ color: C.charcoal }}>{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
