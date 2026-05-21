import { NextResponse } from 'next/server';

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN ?? '';
const PROPERTY_ID   = process.env.GA4_PROPERTY_ID ?? '';

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }),
  });
  const { access_token, error } = await res.json() as { access_token?: string; error?: string };
  if (error || !access_token) throw new Error(`OAuth2 error: ${error}`);
  return access_token;
}

async function runReport(token: string, body: object) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  return res.json();
}

async function runRealtime(token: string) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runRealtimeReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics: [{ name: 'activeUsers' }] }),
    },
  );
  return res.json();
}

function metric(report: Record<string, unknown>, rowIdx: number, metIdx: number): number {
  const rows = report?.rows as Array<{ metricValues: Array<{ value: string }> }> | undefined;
  return parseFloat(rows?.[rowIdx]?.metricValues?.[metIdx]?.value ?? '0');
}

export async function GET() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !PROPERTY_ID) {
    return NextResponse.json(
      { error: 'GA4 not configured — see setup instructions in the Website tab' },
      { status: 503 },
    );
  }

  try {
    const token = await getAccessToken();

    type Row = { dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> };

    const [overview, pages, sources, rt] = await Promise.all([
      runReport(token, {
        dateRanges: [
          { startDate: '28daysAgo', endDate: 'today', name: '28d' },
          { startDate: '7daysAgo',  endDate: 'today', name: '7d'  },
        ],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      }),
      runReport(token, {
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
      runReport(token, {
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
      runRealtime(token),
    ]);

    return NextResponse.json({
      realtime: parseInt((rt as { rows?: Array<{ metricValues: Array<{ value: string }> }> })?.rows?.[0]?.metricValues?.[0]?.value ?? '0'),
      days7: {
        sessions:    metric(overview as Record<string, unknown>, 1, 0),
        users:       metric(overview as Record<string, unknown>, 1, 1),
        pageviews:   metric(overview as Record<string, unknown>, 1, 2),
        bounceRate:  metric(overview as Record<string, unknown>, 1, 3),
        avgDuration: metric(overview as Record<string, unknown>, 1, 4),
      },
      days28: {
        sessions:    metric(overview as Record<string, unknown>, 0, 0),
        users:       metric(overview as Record<string, unknown>, 0, 1),
        pageviews:   metric(overview as Record<string, unknown>, 0, 2),
        bounceRate:  metric(overview as Record<string, unknown>, 0, 3),
        avgDuration: metric(overview as Record<string, unknown>, 0, 4),
      },
      topPages: ((pages as { rows?: Row[] })?.rows ?? []).map((r) => ({
        path:  r.dimensionValues[0].value,
        views: parseInt(r.metricValues[0].value),
        users: parseInt(r.metricValues[1].value),
      })),
      sources: ((sources as { rows?: Row[] })?.rows ?? []).map((r) => ({
        channel:  r.dimensionValues[0].value,
        sessions: parseInt(r.metricValues[0].value),
        users:    parseInt(r.metricValues[1].value),
      })),
    });
  } catch (err) {
    console.error('GA4 error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
