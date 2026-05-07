export const revalidate = 3600;

interface RedditPost {
  title: string;
  score: number;
  url: string;
  subreddit: string;
  selftext: string;
  num_comments: number;
  created_utc: number;
}

// WVW full niche map — every content pillar WVW operates in
const SUBREDDITS = [
  // Burnout + exhaustion
  { sub: "burnout",           query: "" },
  { sub: "WorkReform",        query: "burnout OR exhaustion OR overwork OR rest" },
  // Black wellness + identity
  { sub: "blackmentalhealth", query: "" },
  { sub: "blackladies",       query: "work OR workplace OR wellness OR burnout" },
  // Neurodivergence
  { sub: "ADHD",              query: "work OR career OR workplace OR burnout OR masking" },
  { sub: "neurodiversity",    query: "work OR leadership OR career OR burnout" },
  // HR + organizational wellness
  { sub: "humanresources",    query: "burnout OR wellness OR DEI OR psychological+safety OR neurodivergent" },
  { sub: "managers",          query: "burnout OR team+wellness OR psychological+safety OR inclusion" },
  // Nonprofit sector
  { sub: "nonprofit",         query: "burnout OR staff OR wellbeing OR DEI OR leadership" },
  // Leadership + systems
  { sub: "Leadership",        query: "burnout OR wellbeing OR DEI OR psychological+safety" },
  // Mental health broad
  { sub: "mentalhealth",      query: "workplace OR career OR burnout OR professional" },
];

// WVW content niches — used for scoring and action mapping
const WVW_KEYWORDS = [
  "burnout", "moral injury", "neurodivergent", "adhd", "psychological safety",
  "black women", "black professional", "invisible labor", "emotional labor",
  "dei", "diversity", "equity", "inclusion", "rest", "workplace wellness",
  "leadership", "nonprofit", "exhaustion", "overwork", "accommodation",
  "masking", "identity", "systemic", "corporate culture", "employee experience",
  "manager", "org culture", "trauma-informed", "boundaries", "self-care",
  "founder", "consultant", "wellbeing", "belonging", "retention",
];

async function fetchSubreddit(sub: string, query: string): Promise<RedditPost[]> {
  const url = query
    ? `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(query)}&sort=top&t=week&limit=8&restrict_sr=1`
    : `https://www.reddit.com/r/${sub}/top.json?t=week&limit=8`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "WVWDashboard/2.0 (content intelligence tool; contact wholisticvibeswellness@gmail.com)",
        "Accept": "application/json",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json() as { data?: { children?: { data: RedditPost }[] } };
    return (data.data?.children ?? [])
      .map((c) => ({ ...c.data, subreddit: sub }))
      .filter((p) => p.score > 3 && p.title?.length > 10);
  } catch {
    return [];
  }
}

function relevanceScore(post: RedditPost): number {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  return WVW_KEYWORDS.filter((kw) => text.includes(kw)).length;
}

function momentumLabel(score: number): string {
  if (score >= 300) return "High";
  if (score >= 75)  return "Medium";
  return "Low";
}

function contentAction(title: string, sub: string): string {
  const t = `${title} ${sub}`.toLowerCase();
  if (t.includes("burnout") || t.includes("exhaustion") || t.includes("moral injury"))
    return "Essay + carousel + LinkedIn post";
  if (t.includes("adhd") || t.includes("neurodivergent") || t.includes("neurodiversity") || t.includes("masking"))
    return "Carousel + Bluesky thread + Unicorn Wisdom";
  if (t.includes("black") || t.includes("race") || t.includes("identity") || t.includes("belonging"))
    return "Newsletter + LinkedIn personal essay";
  if (t.includes("rest") || t.includes("boundaries") || t.includes("self-care") || t.includes("wellbeing"))
    return "Unicorn Wisdom + IG carousel + Threads";
  if (t.includes("policy") || t.includes("hr") || t.includes("leader") || t.includes("manager"))
    return "LinkedIn WVW post + The Brief newsletter";
  if (t.includes("nonprofit") || t.includes("social work"))
    return "Blog post + LinkedIn WVW + newsletter";
  if (t.includes("overwork") || t.includes("reform") || t.includes("culture"))
    return "TikTok + Threads thread + Instagram reel";
  return "Blog post + social repurpose across platforms";
}

// Fallback static signals shown when Reddit API is unreachable
const FALLBACK_SIGNALS = [
  { theme: "Burnout is being redefined as a systemic failure, not a personal one", source: "r/burnout", score: 842, comments: 201, momentum: "High", relevance: 6, action: "Essay + carousel + LinkedIn post", url: "https://reddit.com/r/burnout", age: 18 },
  { theme: "ADHD at work: why masking is costing us more than anyone admits", source: "r/ADHD", score: 1240, comments: 387, momentum: "High", relevance: 5, action: "Carousel + Bluesky thread + Unicorn Wisdom", url: "https://reddit.com/r/ADHD", age: 12 },
  { theme: "Our HR team just acknowledged that psychological safety isn't optional", source: "r/humanresources", score: 631, comments: 144, momentum: "High", relevance: 5, action: "LinkedIn WVW post + The Brief newsletter", url: "https://reddit.com/r/humanresources", age: 24 },
  { theme: "Black women in leadership: the emotional labor no one accounts for", source: "r/blackmentalhealth", score: 489, comments: 98, momentum: "Medium", relevance: 7, action: "Newsletter + LinkedIn personal essay", url: "https://reddit.com/r/blackmentalhealth", age: 30 },
  { theme: "Rest is not laziness — why we need to stop rewarding overwork", source: "r/WorkReform", score: 2103, comments: 441, momentum: "High", relevance: 4, action: "TikTok + Threads thread + Instagram reel", url: "https://reddit.com/r/WorkReform", age: 8 },
  { theme: "Nonprofit staff turnover is a burnout crisis, not a pipeline problem", source: "r/nonprofit", score: 376, comments: 87, momentum: "Medium", relevance: 5, action: "Blog post + LinkedIn WVW + newsletter", url: "https://reddit.com/r/nonprofit", age: 42 },
  { theme: "Why neurodivergent employees leave: accommodation ≠ inclusion", source: "r/neurodiversity", score: 583, comments: 129, momentum: "Medium", relevance: 6, action: "Carousel + Bluesky thread + Unicorn Wisdom", url: "https://reddit.com/r/neurodiversity", age: 20 },
  { theme: "The quiet quitting conversation missed the point: this is moral injury", source: "r/WorkReform", score: 1892, comments: 502, momentum: "High", relevance: 5, action: "Essay + carousel + LinkedIn post", url: "https://reddit.com/r/WorkReform", age: 15 },
];

export async function GET() {
  const results = await Promise.allSettled(
    SUBREDDITS.map((s) => fetchSubreddit(s.sub, s.query))
  );

  const all: RedditPost[] = results
    .flatMap((r) => r.status === "fulfilled" ? r.value : [])
    .sort((a, b) => relevanceScore(b) - relevanceScore(a) || b.score - a.score);

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const deduped = all.filter((p) => {
    const key = p.title.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 12);

  if (deduped.length === 0) {
    // Reddit unreachable — return WVW-curated fallback signals
    return Response.json({ signals: FALLBACK_SIGNALS, fetchedAt: new Date().toISOString(), source: "fallback" });
  }

  const signals = deduped.map((post) => ({
    theme: post.title.length > 90 ? post.title.slice(0, 87) + "…" : post.title,
    source: `r/${post.subreddit}`,
    score: post.score,
    comments: post.num_comments,
    momentum: momentumLabel(post.score),
    relevance: relevanceScore(post),
    action: contentAction(post.title, post.subreddit),
    url: `https://reddit.com${post.url}`,
    age: Math.round((Date.now() / 1000 - post.created_utc) / 3600),
  }));

  return Response.json({ signals, fetchedAt: new Date().toISOString(), source: "live" });
}
