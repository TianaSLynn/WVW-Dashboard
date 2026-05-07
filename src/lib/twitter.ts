import crypto from "crypto";

function pct(s: string): string {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

export async function postToTwitter(text: string): Promise<void> {
  const consumerKey = process.env.TWITTER_API_KEY;
  const consumerSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const tokenSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!consumerKey || !consumerSecret || !accessToken || !tokenSecret) {
    throw new Error("Twitter credentials not configured");
  }

  const url = "https://api.twitter.com/2/tweets";
  const oauth: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  // JSON body is not included in the OAuth signature base
  const paramStr = Object.entries(oauth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${pct(k)}=${pct(v)}`)
    .join("&");

  const sigBase = `POST&${pct(url)}&${pct(paramStr)}`;
  const sigKey = `${pct(consumerSecret)}&${pct(tokenSecret)}`;
  const signature = crypto.createHmac("sha1", sigKey).update(sigBase).digest("base64");

  const authHeader =
    "OAuth " +
    Object.entries({ ...oauth, oauth_signature: signature })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${pct(k)}="${pct(v)}"`)
      .join(", ");

  // Twitter hard limit is 280 characters
  const tweetText = text.length > 280 ? text.slice(0, 277) + "…" : text;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ text: tweetText }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Twitter ${res.status}: ${body}`);
  }
}
