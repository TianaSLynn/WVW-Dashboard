export interface BlueskyPostRef { uri: string; cid: string }

async function bskyPost(identifier: string, password: string, text: string): Promise<BlueskyPostRef> {
  const sessionRes = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  if (!sessionRes.ok) throw new Error(`Bluesky auth ${sessionRes.status}: ${await sessionRes.text()}`);

  const { accessJwt, did } = await sessionRes.json() as { accessJwt: string; did: string };

  const res = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessJwt}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      repo: did,
      collection: "app.bsky.feed.post",
      record: { $type: "app.bsky.feed.post", text: text.slice(0, 300), createdAt: new Date().toISOString() },
    }),
  });
  if (!res.ok) throw new Error(`Bluesky post ${res.status}: ${await res.text()}`);
  // createRecord returns { uri, cid } for the record just created -- this is the
  // only handle available later to look up real engagement stats for this post.
  return await res.json() as BlueskyPostRef;
}

export async function postToBluesky(text: string): Promise<BlueskyPostRef> {
  const identifier = process.env.BLUESKY_IDENTIFIER;
  const password = process.env.BLUESKY_APP_PASSWORD;

  if (!identifier || !password) throw new Error("Bluesky credentials not configured");
  return await bskyPost(identifier, password, text);
}

export async function postToBlueskyPersonal(text: string): Promise<BlueskyPostRef> {
  const identifier = process.env.BLUESKY_PERSONAL_IDENTIFIER;
  const password   = process.env.BLUESKY_PERSONAL_APP_PASSWORD;
  if (!identifier || !password) throw new Error("Personal Bluesky credentials not configured");
  return await bskyPost(identifier, password, text);
}

// Batch-fetches real engagement counts for up to 25 posts at a time via
// Bluesky's public, unauthenticated getPosts endpoint.
export interface BlueskyPostStats { uri: string; likeCount: number; repostCount: number; replyCount: number; quoteCount: number }

export async function fetchBlueskyStats(uris: string[]): Promise<BlueskyPostStats[]> {
  if (uris.length === 0) return [];
  const results: BlueskyPostStats[] = [];
  for (let i = 0; i < uris.length; i += 25) {
    const batch = uris.slice(i, i + 25);
    const params = new URLSearchParams();
    batch.forEach((uri) => params.append("uris[]", uri));
    const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPosts?${params.toString()}`);
    if (!res.ok) throw new Error(`Bluesky getPosts ${res.status}: ${await res.text()}`);
    const { posts } = await res.json() as { posts: Array<{ uri: string; likeCount?: number; repostCount?: number; replyCount?: number; quoteCount?: number }> };
    for (const p of posts) {
      results.push({
        uri: p.uri,
        likeCount: p.likeCount ?? 0,
        repostCount: p.repostCount ?? 0,
        replyCount: p.replyCount ?? 0,
        quoteCount: p.quoteCount ?? 0,
      });
    }
  }
  return results;
}
