import { NextResponse } from 'next/server';

const API_KEY = process.env.BEEHIIV_API_KEY ?? '';
const rawPubId = process.env.BEEHIIV_PUBLICATION_ID ?? '';
const PUB_ID  = rawPubId.startsWith('pub_') ? rawPubId : `pub_${rawPubId}`;
const BASE    = 'https://api.beehiiv.com/v2';

async function bfetch(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Beehiiv ${path} → ${res.status}`);
  return res.json();
}

export async function GET() {
  if (!API_KEY || !PUB_ID) {
    return NextResponse.json({ error: 'Beehiiv not configured' }, { status: 503 });
  }

  try {
    const [pub, posts] = await Promise.all([
      bfetch(`/publications/${PUB_ID}`),
      bfetch(`/publications/${PUB_ID}/posts?status=confirmed&limit=5&order_by=publish_date&direction=desc`),
    ]);

    const p = pub.data ?? {};
    const recentPosts = (posts.data ?? []).map((post: Record<string, unknown>) => ({
      id:          post.id,
      subject:     post.subject_line ?? post.title ?? 'Untitled',
      publishDate: post.publish_date ?? post.created,
      stats: {
        recipients:  (post.stats as Record<string, number>)?.recipients  ?? 0,
        opens:       (post.stats as Record<string, number>)?.unique_opens ?? 0,
        clicks:      (post.stats as Record<string, number>)?.unique_clicks ?? 0,
        openRate:    (post.stats as Record<string, number>)?.open_rate    ?? 0,
        clickRate:   (post.stats as Record<string, number>)?.click_rate   ?? 0,
      },
    }));

    return NextResponse.json({
      name:              p.name ?? 'Newsletter',
      totalSubscribers:  p.active_subscriber_count ?? p.total_active_subscriptions ?? 0,
      freeSubscribers:   p.active_subscriber_count ?? 0,
      recentPosts,
    });
  } catch (err) {
    console.error('Beehiiv error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
