"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Mail, Users, MousePointerClick, TrendingUp } from "lucide-react";

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

type Post = {
  id: string;
  subject: string;
  publishDate: number;
  stats: { recipients: number; opens: number; clicks: number; openRate: number; clickRate: number };
};

type BeehiivData = {
  name: string;
  totalSubscribers: number;
  freeSubscribers: number;
  recentPosts: Post[];
};

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(Math.round(n));
}

function fmtPct(n: number) {
  return (n * 100).toFixed(1) + '%';
}

function fmtDate(ts: number | string) {
  const d = new Date(typeof ts === 'number' ? ts * 1000 : ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: React.ElementType }) {
  return (
    <Card className="rounded-2xl shadow-none" style={{ background: C.bone, borderColor: '#DDD7CD' }}>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: C.charcoal }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color: C.warmBlack }}>{value}</p>
            {sub && <p className="text-xs mt-1" style={{ color: C.sage }}>{sub}</p>}
          </div>
          <div className="rounded-xl p-2" style={{ background: C.ivory }}>
            <Icon className="w-4 h-4" style={{ color: C.forest }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NewsletterAnalytics() {
  const [data, setData]       = useState<BeehiivData | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/beehiiv-stats')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Could not reach Beehiiv API.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.forest }} />
    </div>
  );

  if (error) return (
    <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: '#DDD7CD' }}>
      <CardContent className="pt-8 pb-8 text-center space-y-2">
        <Mail className="w-8 h-8 mx-auto" style={{ color: C.rose }} />
        <p className="font-semibold" style={{ color: C.warmBlack }}>Beehiiv not connected</p>
        <p className="text-sm" style={{ color: C.charcoal }}>{error}</p>
        <p className="text-xs" style={{ color: C.sage }}>Add BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID to Vercel → Settings → Environment Variables</p>
      </CardContent>
    </Card>
  );

  const posts = data!.recentPosts;
  const avgOpen  = posts.length ? posts.reduce((s, p) => s + p.stats.openRate,  0) / posts.length : 0;
  const avgClick = posts.length ? posts.reduce((s, p) => s + p.stats.clickRate, 0) / posts.length : 0;

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl" style={{ color: C.warmBlack }}>{data!.name}</h2>
          <p className="text-xs" style={{ color: C.charcoal }}>Beehiiv · live data</p>
        </div>
        <a href="https://app.beehiiv.com" target="_blank" rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-full transition-colors"
          style={{ background: C.ivory, color: C.charcoal, border: '1px solid #DDD7CD', textDecoration: 'none' }}>
          Open Beehiiv ↗
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Subscribers" value={fmt(data!.totalSubscribers)} sub="active"          icon={Users} />
        <StatCard label="Avg Open Rate" value={fmtPct(avgOpen)}  sub={`${posts.length} issues`} icon={Mail} />
        <StatCard label="Avg Click Rate" value={fmtPct(avgClick)} sub="last 5 issues"           icon={MousePointerClick} />
        <StatCard label="Issues Sent"   value={String(posts.length)} sub="shown below"          icon={TrendingUp} />
      </div>

      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: '#DDD7CD' }}>
        <CardHeader>
          <CardTitle className="font-serif text-base">Recent Issues</CardTitle>
          <CardDescription style={{ color: C.charcoal }}>Last 5 published</CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: C.charcoal }}>No published issues yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-widest" style={{ color: C.sage }}>
                  <th className="text-left pb-2 font-semibold">Subject</th>
                  <th className="text-right pb-2 font-semibold">Sent</th>
                  <th className="text-right pb-2 font-semibold">Opens</th>
                  <th className="text-right pb-2 font-semibold">Clicks</th>
                  <th className="text-right pb-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-t" style={{ borderColor: '#DDD7CD' }}>
                    <td className="py-2 pr-3 text-xs" style={{ color: C.warmBlack, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.subject}</td>
                    <td className="py-2 text-right text-xs font-semibold" style={{ color: C.forest }}>{fmt(p.stats.recipients)}</td>
                    <td className="py-2 text-right text-xs" style={{ color: C.charcoal }}>{fmtPct(p.stats.openRate)}</td>
                    <td className="py-2 text-right text-xs" style={{ color: C.charcoal }}>{fmtPct(p.stats.clickRate)}</td>
                    <td className="py-2 text-right text-xs" style={{ color: C.sage }}>{fmtDate(p.publishDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
