import type { ContentPost, Conversion } from "@/types/dashboard";

export function calcEngagementRate(p: ContentPost): number {
  return p.reach > 0
    ? +((p.likes + p.comments + p.shares + p.saves) / p.reach * 100).toFixed(2)
    : 0;
}

export function saveRate(p: ContentPost): number {
  return p.reach > 0 ? +(p.saves / p.reach * 100).toFixed(2) : 0;
}

export function shareRate(p: ContentPost): number {
  return p.reach > 0 ? +(p.shares / p.reach * 100).toFixed(2) : 0;
}

export function contentHealthScore(p: ContentPost): number {
  const eng  = calcEngagementRate(p);
  const save = saveRate(p);
  const share = shareRate(p);
  const convBonus = p.conversionFlag ? 20 : 0;
  const commentBonus = p.comments > 30 ? 15 : p.comments > 10 ? 8 : 3;
  return Math.min(100, Math.round(eng * 2.5 + save * 5 + share * 4 + convBonus + commentBonus));
}

export function repurposeScore(p: ContentPost): number {
  return Math.min(100, Math.round(
    saveRate(p) * 10 + shareRate(p) * 8 + (p.comments / 200 * 15) + (p.conversionFlag ? 30 : 0)
  ));
}

export function topPerformingPlatform(posts: ContentPost[]): string {
  const map: Record<string, number[]> = {};
  posts.forEach((p) => {
    if (!map[p.platform]) map[p.platform] = [];
    map[p.platform].push(calcEngagementRate(p));
  });
  let top = "—", best = 0;
  Object.entries(map).forEach(([plat, rates]) => {
    const avg = rates.reduce((s, r) => s + r, 0) / rates.length;
    if (avg > best) { best = avg; top = plat; }
  });
  return top;
}

export function platformAvgEngagement(posts: ContentPost[]): Record<string, number> {
  const map: Record<string, number[]> = {};
  posts.forEach((p) => {
    if (!map[p.platform]) map[p.platform] = [];
    map[p.platform].push(calcEngagementRate(p));
  });
  const result: Record<string, number> = {};
  Object.entries(map).forEach(([plat, rates]) => {
    result[plat] = +(rates.reduce((s, r) => s + r, 0) / rates.length).toFixed(2);
  });
  return result;
}

export function topConvertingContent(posts: ContentPost[]): ContentPost[] {
  return posts.filter((p) => p.conversionFlag).sort((a, b) => calcEngagementRate(b) - calcEngagementRate(a));
}

export function conversionRate(conversions: Conversion[], totalReach: number): number {
  return totalReach > 0 ? +(conversions.length / totalReach * 100).toFixed(3) : 0;
}

export function revenueByPlatform(conversions: Conversion[]): Record<string, number> {
  const result: Record<string, number> = {};
  conversions.forEach((c) => {
    result[c.sourcePlatform] = (result[c.sourcePlatform] ?? 0) + c.conversionValue;
  });
  return result;
}

export function platformGrowthRate(platform: string, posts: ContentPost[]): number {
  const sorted = [...posts.filter((p) => p.platform === platform)].sort(
    (a, b) => new Date(a.datePosted).getTime() - new Date(b.datePosted).getTime()
  );
  if (sorted.length < 4) return 0;
  const half = Math.floor(sorted.length / 2);
  const older  = sorted.slice(0, half);
  const recent = sorted.slice(half);
  const avgOld = older.reduce((s, p) => s + calcEngagementRate(p), 0) / older.length;
  const avgNew = recent.reduce((s, p) => s + calcEngagementRate(p), 0) / recent.length;
  return avgOld > 0 ? +(((avgNew - avgOld) / avgOld) * 100).toFixed(1) : 0;
}
