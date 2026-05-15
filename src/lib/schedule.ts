export type Platform =
  | "linkedin_personal"
  | "linkedin_wvw"
  | "instagram"
  | "threads"
  | "tiktok"
  | "bluesky"
  | "bluesky_personal"
  | "facebook";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
type Day = (typeof DAYS)[number];

const CONTENT_PILLARS = [
  "Black Mental Health",
  "Psychological Safety",
  "Neuroinclusion",
  "Burnout / Moral Injury",
  "CEO / BTS",
  "Unicorn Wisdoms",
  "WVW Academy",
  "Rest as Strategy",
  "Invisible Labor",
];

function parseDays(env: string | undefined, fallback: Day[]): Day[] {
  if (!env) return fallback;
  return env.split(",").map((d) => d.trim() as Day);
}

// Research-backed 2026 frequencies:
// LinkedIn: 5-6x/week (best reach Mon-Sat, avoid Sunday)
// Threads: daily (algorithm rewards consistency)
// Bluesky: daily (fast-growing professional audience; daily presence compounds)
// Facebook: 5x/week (Mon-Fri for B2B; weekend drops off for org buyers)
// Instagram: 4-5x/week (quality > quantity; algorithm favors saves + shares)
// TikTok: 4-5x/week (Mon-Fri; B2B content peaks midweek)
export const POSTING_SCHEDULE: Record<Platform, Day[]> = {
  linkedin_personal: parseDays(process.env.POST_LINKEDIN_PERSONAL_DAYS, ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
  linkedin_wvw:      parseDays(process.env.POST_LINKEDIN_WVW_DAYS,      ["Mon", "Tue", "Wed", "Thu", "Fri"]),
  instagram:         parseDays(process.env.POST_INSTAGRAM_DAYS,         ["Mon", "Tue", "Wed", "Thu", "Fri"]),
  threads:           parseDays(process.env.POST_THREADS_DAYS,           ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
  tiktok:            parseDays(process.env.POST_TIKTOK_DAYS,            ["Mon", "Tue", "Wed", "Thu", "Fri"]),
  bluesky:           parseDays(process.env.POST_BLUESKY_DAYS,           ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
  bluesky_personal:  parseDays(process.env.POST_BLUESKY_PERSONAL_DAYS,  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
  facebook:          parseDays(process.env.POST_FACEBOOK_DAYS,          ["Mon", "Tue", "Wed", "Thu", "Fri"]),
};

export function getTodayPlatforms(): Platform[] {
  const day = DAYS[new Date().getDay()];
  return (Object.keys(POSTING_SCHEDULE) as Platform[]).filter((p) =>
    POSTING_SCHEDULE[p].includes(day)
  );
}

export function getTodayTheme(): string {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - start) / 86400000);
  return CONTENT_PILLARS[dayOfYear % CONTENT_PILLARS.length];
}
