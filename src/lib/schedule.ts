export type Platform =
  | "linkedin_personal"
  | "linkedin_wvw"
  | "instagram"
  | "threads"
  | "tiktok"
  | "twitter"
  | "bluesky"
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
];

function parseDays(env: string | undefined, fallback: Day[]): Day[] {
  if (!env) return fallback;
  return env.split(",").map((d) => d.trim() as Day);
}

export const POSTING_SCHEDULE: Record<Platform, Day[]> = {
  linkedin_personal: parseDays(process.env.POST_LINKEDIN_PERSONAL_DAYS, ["Mon", "Tue", "Wed", "Thu", "Fri"]),
  linkedin_wvw:      parseDays(process.env.POST_LINKEDIN_WVW_DAYS,      ["Mon", "Wed", "Fri"]),
  instagram:         parseDays(process.env.POST_INSTAGRAM_DAYS,         ["Mon", "Wed", "Fri"]),
  threads:           parseDays(process.env.POST_THREADS_DAYS,           ["Mon", "Wed", "Fri"]),
  tiktok:            parseDays(process.env.POST_TIKTOK_DAYS,            ["Tue", "Thu"]),
  twitter:           parseDays(process.env.POST_TWITTER_DAYS,           ["Mon", "Tue", "Wed", "Thu", "Fri"]),
  bluesky:           parseDays(process.env.POST_BLUESKY_DAYS,           ["Mon", "Wed", "Fri"]),
  facebook:          parseDays(process.env.POST_FACEBOOK_DAYS,          ["Mon", "Wed", "Fri"]),
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
