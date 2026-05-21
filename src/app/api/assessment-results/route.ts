import { NextResponse } from 'next/server';

const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN ?? '';

export async function GET() {
  if (!NETLIFY_TOKEN) {
    return NextResponse.json({ error: 'no_token' }, { status: 503 });
  }

  try {
    // List all forms for this site to find burnout-results-optin
    const formsRes = await fetch('https://api.netlify.com/api/v1/forms', {
      headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` },
    });
    const forms = await formsRes.json() as Array<{ id: string; name: string; site_id: string; submission_count: number }>;

    const form = forms.find(f => f.name === 'burnout-results-optin');
    if (!form) {
      return NextResponse.json({ submissions: [], total: 0, message: 'Form not found — deploy site first' });
    }

    const subsRes = await fetch(
      `https://api.netlify.com/api/v1/forms/${form.id}/submissions?per_page=50`,
      { headers: { Authorization: `Bearer ${NETLIFY_TOKEN}` } },
    );
    const rawSubs = await subsRes.json() as Array<Record<string, unknown>>;

    const submissions = rawSubs.map(s => ({
      id:           s.id,
      createdAt:    s.created_at,
      name:         (s.data as Record<string, string>)?.name ?? '',
      email:        (s.data as Record<string, string>)?.email ?? '',
      organization: (s.data as Record<string, string>)?.organization ?? '',
      score:        parseInt((s.data as Record<string, string>)?.score ?? '0'),
      riskLevel:    (s.data as Record<string, string>)?.['risk-level'] ?? '',
    }));

    return NextResponse.json({ submissions, total: form.submission_count });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
