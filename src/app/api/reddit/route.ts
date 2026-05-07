export const revalidate = 3600; // cache 1 hour

interface RedditPost {
  title: string;
  score: number;
  url: string;
  subreddit: string;
  selftext: string;
  num_comments: number;
  created_utc: number;
}

const SUBREDDITS = [
  { sub: "humanresources",    query: "burnout OR wellness OR DEI OR neurodivergent OR psychological+safety" },
  { sub: "blackmentalhealth", query: "" },
  { sub: "ADHD",              query: "work OR career OR workplace OR burnout" },
  { sub: "neurodivergent",    query: "work OR career OR leadership" },
  { sub: "burnout",           query: "" },
  { sub: "nonprofit",         query: "burnout OR staff OR wellbeing OR DEI" },
];

async function fetchSubreddit(sub: string, query: string): Promise<RedditPost[]> {
  const url = query
    ? `https://www.reddit.com/r/${sub}/search.json?q=${query}&sort=top&t=week&limit=8&restrict_sr=1`
    : `https://www.reddit.com/r/${sub}/top.json?t=week&limit=8`;

  const res = await fetch(url, {
    headers: { "User-Agent": "WVWCommandCenter/1.0 (dashboard)" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json() as { data: { children: { data: RedditPost }[] } };
  return data.data.children
    .map((c) => ({ ...c.data, subreddit: sub }))
    .filter((p) => p.score > 5);
}

const WVW_KEYWORDS = [
  "burnout", "moral injury", "neurodivergent", "adhd", "psychological safety",
  "black women", "invisible labor", "emotional labor", "DEI", "rest", "workplace",
  "leadership", "nonprofit", "exhaustion", "inclusion", "trauma", "boundaries",
  "overwork", "corporate", "identity", "equity", "accommodation",
];

function relevanceScore(post: RedditPost): number {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  return WVW_KEYWORDS.filter((kw) => text.includes(kw)).length;
}

function momentumLabel(score: number): string {
  if (score >= 200) return "High";
  if (score >= 50)  return "Medium";
  return "Low";
}

function contentAction(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("burnout") || t.includes("exhaustion") || t.includes("moral")) return "Essay + carousel + LinkedIn post";
  if (t.includes("adhd") || t.includes("neurodivergent"))                       return "Carousel + Bluesky thread + Unicorn Wisdom";
  if (t.includes("black") || t.includes("race") || t.includes("identity"))      return "Newsletter + LinkedIn personal essay";
  if (t.includes("rest") || t.includes("boundaries"))                           return "Unicorn Wisdom + IG carousel";
  if (t.includes("policy") || t.includes("hr") || t.includes("leadership"))     return "LinkedIn WVW post + The Brief";
  return "Blog post + social repurpose";
}

export async function GET() {
  const results = await Promise.allSettled(
    SUBREDDITS.map((s) => fetchSubreddit(s.sub, s.query))
  );

  const all: RedditPost[] = results
    .flatMap((r) => r.status === "fulfilled" ? r.value : [])
    .sort((a, b) => relevanceScore(b) - relevanceScore(a) || b.score - a.score)
    .slice(0, 12);

  const signals = all.map((post) => ({
    theme: post.title.length > 90 ? post.title.slice(0, 87) + "…" : post.title,
    source: `r/${post.subreddit}`,
    score: post.score,
    comments: post.num_comments,
    momentum: momentumLabel(post.score),
    relevance: relevanceScore(post),
    action: contentAction(post.title),
    url: `https://reddit.com${post.url}`,
    age: Math.round((Date.now() / 1000 - post.created_utc) / 3600),
  }));

  return Response.json({ signals, fetchedAt: new Date().toISOString() });
}
