"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Globe, Users, Eye, MousePointerClick, Clock, Wifi } from "lucide-react";

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

type GAData = {
  realtime: number;
  days7:  { sessions: number; users: number; pageviews: number; bounceRate: number; avgDuration: number };
  days28: { sessions: number; users: number; pageviews: number; bounceRate: number; avgDuration: number };
  topPages: { path: string; views: number; users: number }[];
  sources:  { channel: string; sessions: number; users: number }[];
};

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(Math.round(n));
}

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}m ${s}s`;
}

function fmtPath(path: string) {
  if (path === '/') return 'Home';
  return path.replace(/^\//, '').replace(/\.html$/, '').replace(/-/g, ' ').replace(/\//g, ' › ');
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

export default function WebsiteAnalytics() {
  const [data, setData]       = useState<GAData | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange]     = useState<'7d' | '28d'>('7d');

  useEffect(() => {
    fetch('/api/website-analytics')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Could not reach the analytics API.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.forest }} />
    </div>
  );

  if (error) return (
    <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: '#DDD7CD' }}>
      <CardContent className="pt-8 pb-8 text-center space-y-3">
        <Globe className="w-8 h-8 mx-auto" style={{ color: C.rose }} />
        <p className="font-semibold" style={{ color: C.warmBlack }}>GA4 Not Connected Yet</p>
        <p className="text-sm max-w-md mx-auto" style={{ color: C.charcoal }}>{error}</p>
        <div className="text-left bg-white rounded-xl p-4 max-w-lg mx-auto mt-4 text-xs space-y-1.5 border" style={{ borderColor: '#DDD7CD' }}>
          <p className="font-semibold mb-2" style={{ color: C.forest }}>Setup steps (OAuth2 — no service account key needed):</p>
          <p>1. Go to <strong>console.cloud.google.com</strong> → APIs &amp; Services → Credentials → Create OAuth client ID (type: Web application)</p>
          <p>2. Add <strong>https://developers.google.com/oauthplayground</strong> as an Authorized Redirect URI → save → copy Client ID &amp; Secret</p>
          <p>3. Go to <strong>developers.google.com/oauthplayground</strong> → gear icon → check &quot;Use your own OAuth credentials&quot; → paste them in</p>
          <p>4. In Step 1 enter scope: <code>https://www.googleapis.com/auth/analytics.readonly</code> → Authorize APIs → sign in with your Google account</p>
          <p>5. In Step 2 click <strong>Exchange authorization code for tokens</strong> → copy the Refresh Token</p>
          <p>6. Paste all three values into chat — I&apos;ll add them to .env.local for you:</p>
          <pre className="bg-gray-50 rounded p-2 mt-1 overflow-x-auto" style={{ fontSize: '0.7rem' }}>{`GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...`}</pre>
        </div>
      </CardContent>
    </Card>
  );

  const d = range === '7d' ? data!.days7 : data!.days28;

  return (
    <div className="space-y-4">

      {/* Header + range toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl" style={{ color: C.warmBlack }}>wvwacademy.com</h2>
          <p className="text-xs" style={{ color: C.charcoal }}>Google Analytics · live data</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: '#D4EDDA', color: '#155724' }}>
            <Wifi className="w-3 h-3" />
            {data!.realtime} active now
          </div>
          {(['7d', '28d'] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              className="text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{ background: range === r ? C.forest : C.ivory, color: range === r ? C.bone : C.charcoal, border: `1px solid ${range === r ? C.forest : '#DDD7CD'}` }}>
              {r === '7d' ? 'Last 7 days' : 'Last 28 days'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Sessions"   value={fmt(d.sessions)}   icon={Globe} />
        <StatCard label="Users"      value={fmt(d.users)}      icon={Users} />
        <StatCard label="Page Views" value={fmt(d.pageviews)}  icon={Eye} />
        <StatCard label="Avg. Time"  value={fmtDuration(d.avgDuration)} sub={`Bounce ${Math.round(d.bounceRate * 100)}%`} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top pages */}
        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: '#DDD7CD' }}>
          <CardHeader>
            <CardTitle className="font-serif text-base">Top Pages</CardTitle>
            <CardDescription style={{ color: C.charcoal }}>By pageviews · last {range === '7d' ? '7' : '28'} days</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-widest" style={{ color: C.sage }}>
                  <th className="text-left pb-2 font-semibold">Page</th>
                  <th className="text-right pb-2 font-semibold">Views</th>
                  <th className="text-right pb-2 font-semibold">Users</th>
                </tr>
              </thead>
              <tbody>
                {data!.topPages.slice(0, 8).map((p, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: '#DDD7CD' }}>
                    <td className="py-2 pr-2 text-xs capitalize" style={{ color: C.warmBlack }}>{fmtPath(p.path)}</td>
                    <td className="py-2 text-right text-xs font-semibold" style={{ color: C.forest }}>{fmt(p.views)}</td>
                    <td className="py-2 text-right text-xs" style={{ color: C.charcoal }}>{fmt(p.users)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Traffic sources */}
        <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: '#DDD7CD' }}>
          <CardHeader>
            <CardTitle className="font-serif text-base">Traffic Sources</CardTitle>
            <CardDescription style={{ color: C.charcoal }}>Sessions by channel · last {range === '7d' ? '7' : '28'} days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data!.sources} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDD7CD" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: C.charcoal }} />
                <YAxis type="category" dataKey="channel" tick={{ fontSize: 10, fill: C.charcoal }} width={90} />
                <Tooltip
                  contentStyle={{ background: C.ivory, border: `1px solid #DDD7CD`, borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [fmt(Number(v)), 'Sessions']}
                />
                <Bar dataKey="sessions" fill={C.forest} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* Burnout assessment callout */}
      {data!.topPages.some(p => p.path.includes('burnout')) && (
        <Card className="rounded-2xl shadow-none" style={{ background: C.ivory, borderColor: '#DDD7CD', borderLeft: `3px solid ${C.gold}` }}>
          <CardContent className="pt-4 pb-4 flex items-center gap-4">
            <MousePointerClick className="w-5 h-5 flex-shrink-0" style={{ color: C.gold }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: C.warmBlack }}>
                Burnout Assessment: {fmt(data!.topPages.find(p => p.path.includes('burnout'))?.views ?? 0)} views this period
              </p>
              <p className="text-xs" style={{ color: C.charcoal }}>
                {fmt(data!.topPages.find(p => p.path.includes('burnout'))?.users ?? 0)} unique visitors to the assessment page
              </p>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
