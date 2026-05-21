"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ClipboardList, AlertCircle } from "lucide-react";

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

type Submission = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  organization: string;
  score: number;
  riskLevel: string;
};

const RISK_COLORS: Record<string, string> = {
  'Low Risk':      '#16a34a',
  'Moderate Risk': C.gold,
  'High Risk':     '#dc2626',
  'Critical Risk': '#7f1d1d',
};

export default function AssessmentResults() {
  const [subs, setSubs]     = useState<Submission[]>([]);
  const [total, setTotal]   = useState(0);
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [noToken, setNoToken] = useState(false);

  useEffect(() => {
    fetch('/api/assessment-results')
      .then(r => r.json())
      .then(d => {
        if (d.error === 'no_token') { setNoToken(true); return; }
        if (d.error) { setError(d.error); return; }
        setSubs(d.submissions ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => setError('Could not reach assessment API.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: C.forest }} />
    </div>
  );

  if (noToken) return (
    <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: '#DDD7CD' }}>
      <CardContent className="pt-8 pb-8 text-center space-y-3">
        <ClipboardList className="w-8 h-8 mx-auto" style={{ color: C.rose }} />
        <p className="font-semibold" style={{ color: C.warmBlack }}>Assessment Results Not Connected</p>
        <p className="text-sm" style={{ color: C.charcoal }}>Add a Netlify Personal Access Token to see burnout assessment opt-ins here.</p>
        <div className="text-left bg-white rounded-xl p-4 max-w-md mx-auto text-xs space-y-1.5 border" style={{ borderColor: '#DDD7CD' }}>
          <p className="font-semibold mb-2" style={{ color: C.forest }}>Setup:</p>
          <p>1. Go to <strong>app.netlify.com</strong> → User Settings → Applications → Personal Access Tokens</p>
          <p>2. Create a new token and copy it</p>
          <p>3. Add to .env.local: <code>NETLIFY_TOKEN=your-token-here</code></p>
          <p>4. Also add to Vercel environment variables</p>
        </div>
      </CardContent>
    </Card>
  );

  if (error) return (
    <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: '#DDD7CD' }}>
      <CardContent className="pt-6 pb-6 text-center">
        <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: C.rose }} />
        <p className="text-sm" style={{ color: C.charcoal }}>{error}</p>
      </CardContent>
    </Card>
  );

  const byRisk = subs.reduce<Record<string, number>>((acc, s) => {
    acc[s.riskLevel] = (acc[s.riskLevel] ?? 0) + 1;
    return acc;
  }, {});

  const avgScore = subs.length ? Math.round(subs.reduce((s, sub) => s + sub.score, 0) / subs.length) : 0;

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl" style={{ color: C.warmBlack }}>Burnout Assessment</h2>
          <p className="text-xs" style={{ color: C.charcoal }}>Opt-in submissions via Netlify Forms</p>
        </div>
        <a href="https://app.netlify.com" target="_blank" rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-full"
          style={{ background: C.ivory, color: C.charcoal, border: '1px solid #DDD7CD', textDecoration: 'none' }}>
          Netlify ↗
        </a>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-2xl shadow-none" style={{ background: C.bone, borderColor: '#DDD7CD' }}>
          <CardContent className="pt-5 pb-5 text-center">
            <p className="text-2xl font-bold" style={{ color: C.warmBlack }}>{total}</p>
            <p className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: C.charcoal }}>Total Submissions</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-none" style={{ background: C.bone, borderColor: '#DDD7CD' }}>
          <CardContent className="pt-5 pb-5 text-center">
            <p className="text-2xl font-bold" style={{ color: C.warmBlack }}>{avgScore}</p>
            <p className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: C.charcoal }}>Avg Score</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl shadow-none" style={{ background: C.bone, borderColor: '#DDD7CD' }}>
          <CardContent className="pt-5 pb-5 text-center">
            <p className="text-2xl font-bold" style={{ color: C.rose }}>{byRisk['High Risk'] ?? 0 + (byRisk['Critical Risk'] ?? 0)}</p>
            <p className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: C.charcoal }}>High / Critical</p>
          </CardContent>
        </Card>
      </div>

      {Object.keys(byRisk).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.entries(byRisk).map(([level, count]) => (
            <span key={level} className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: (RISK_COLORS[level] ?? C.charcoal) + '22', color: RISK_COLORS[level] ?? C.charcoal }}>
              {level}: {count}
            </span>
          ))}
        </div>
      )}

      <Card className="rounded-3xl shadow-none" style={{ background: C.bone, borderColor: '#DDD7CD' }}>
        <CardHeader>
          <CardTitle className="font-serif text-base">Recent Opt-Ins</CardTitle>
          <CardDescription style={{ color: C.charcoal }}>People who shared their results with WVW</CardDescription>
        </CardHeader>
        <CardContent>
          {subs.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: C.charcoal }}>
              No submissions yet. Assessment opt-ins will appear here once someone takes the assessment and shares their results.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-widest" style={{ color: C.sage }}>
                  <th className="text-left pb-2 font-semibold">Name</th>
                  <th className="text-left pb-2 font-semibold">Email</th>
                  <th className="text-left pb-2 font-semibold">Org</th>
                  <th className="text-right pb-2 font-semibold">Score</th>
                  <th className="text-right pb-2 font-semibold">Risk</th>
                  <th className="text-right pb-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s.id} className="border-t" style={{ borderColor: '#DDD7CD' }}>
                    <td className="py-2 pr-2 text-xs" style={{ color: C.warmBlack }}>{s.name || '—'}</td>
                    <td className="py-2 pr-2 text-xs" style={{ color: C.charcoal }}>{s.email}</td>
                    <td className="py-2 pr-2 text-xs" style={{ color: C.charcoal }}>{s.organization || '—'}</td>
                    <td className="py-2 text-right text-xs font-semibold" style={{ color: C.forest }}>{s.score}</td>
                    <td className="py-2 text-right text-xs">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: (RISK_COLORS[s.riskLevel] ?? C.charcoal) + '22', color: RISK_COLORS[s.riskLevel] ?? C.charcoal }}>
                        {s.riskLevel}
                      </span>
                    </td>
                    <td className="py-2 text-right text-xs" style={{ color: C.sage }}>
                      {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
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
