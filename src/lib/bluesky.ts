async function bskyPost(identifier: string, password: string, text: string): Promise<void> {
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
}

export async function postToBluesky(text: string): Promise<void> {
  const identifier = process.env.BLUESKY_IDENTIFIER;
  const password = process.env.BLUESKY_APP_PASSWORD;

  if (!identifier || !password) throw new Error("Bluesky credentials not configured");
  await bskyPost(identifier, password, text);
}

export async function postToBlueskyPersonal(text: string): Promise<void> {
  const identifier = process.env.BLUESKY_PERSONAL_IDENTIFIER;
  const password   = process.env.BLUESKY_PERSONAL_APP_PASSWORD;
  if (!identifier || !password) throw new Error("Personal Bluesky credentials not configured");
  await bskyPost(identifier, password, text);
}
