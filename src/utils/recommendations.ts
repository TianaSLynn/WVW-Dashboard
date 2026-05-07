import type { ContentPost, RepurposeRecommendation, RepurposeAction } from "@/types/dashboard";
import { calcEngagementRate, saveRate, shareRate, repurposeScore, topPerformingPlatform, platformAvgEngagement } from "./calculations";

export function generateInsights(posts: ContentPost[]): string[] {
  if (!posts.length) return ["No data yet — begin tracking posts to generate insights."];

  const insights: string[] = [];
  const avgEng = posts.reduce((s, p) => s + calcEngagementRate(p), 0) / posts.length;

  // Best platform
  const topPlat = topPerformingPlatform(posts);
  insights.push(`${topPlat} is your highest-performing platform by average engagement rate.`);

  // Content type comparison
  const byType: Record<string, number[]> = {};
  posts.forEach((p) => {
    if (!byType[p.contentType]) byType[p.contentType] = [];
    byType[p.contentType].push(calcEngagementRate(p));
  });
  let topType = "", topTypeEng = 0;
  Object.entries(byType).forEach(([type, rates]) => {
    const avg = rates.reduce((s, r) => s + r, 0) / rates.length;
    if (avg > topTypeEng) { topTypeEng = avg; topType = type; }
  });
  if (topType) insights.push(`${topType} content drives the strongest engagement at ${topTypeEng.toFixed(1)}% avg rate.`);

  // Best topic
  const byTopic: Record<string, number[]> = {};
  posts.forEach((p) => {
    if (!byTopic[p.topicCategory]) byTopic[p.topicCategory] = [];
    byTopic[p.topicCategory].push(calcEngagementRate(p));
  });
  let topTopic = "", topTopicEng = 0;
  Object.entries(byTopic).forEach(([topic, rates]) => {
    const avg = rates.reduce((s, r) => s + r, 0) / rates.length;
    if (avg > topTopicEng) { topTopicEng = avg; topTopic = topic; }
  });
  if (topTopic) insights.push(`"${topTopic}" is your strongest topic — consider expanding this content pillar.`);

  // Hook type
  const byHook: Record<string, number[]> = {};
  posts.forEach((p) => {
    if (!byHook[p.hookType]) byHook[p.hookType] = [];
    byHook[p.hookType].push(p.comments);
  });
  let topHook = "", topHookComments = 0;
  Object.entries(byHook).forEach(([hook, comments]) => {
    const avg = comments.reduce((s, c) => s + c, 0) / comments.length;
    if (avg > topHookComments) { topHookComments = avg; topHook = hook; }
  });
  if (topHook) insights.push(`${topHook} hooks generate the most comments — use them for discussion-heavy posts.`);

  // High saves → repurpose signal
  const highSaves = posts.filter((p) => saveRate(p) > 2);
  if (highSaves.length) insights.push(`${highSaves.length} post${highSaves.length > 1 ? "s" : ""} have unusually high save rates — strong repurpose candidates for newsletters and carousels.`);

  // Conversion activity
  const converters = posts.filter((p) => p.conversionFlag);
  if (converters.length) {
    const convPlats = [...new Set(converters.map((p) => p.platform))];
    insights.push(`Conversion activity is strongest on ${convPlats.join(", ")}. Prioritize CTAs on these platforms.`);
  }

  // Underperforming
  const underperforming = posts.filter((p) => calcEngagementRate(p) < avgEng * 0.5);
  if (underperforming.length) {
    insights.push(`${underperforming.length} post${underperforming.length > 1 ? "s are" : " is"} significantly underperforming the average. Review hook style and posting time.`);
  }

  // High shares → LinkedIn expansion
  const highShares = posts.filter((p) => shareRate(p) > 1.5);
  if (highShares.length) insights.push(`High-share posts cluster around workplace and leadership content — ideal for LinkedIn thought leadership expansion.`);

  // Next move
  const platAvgs = platformAvgEngagement(posts);
  const lowestPlat = Object.entries(platAvgs).sort((a, b) => a[1] - b[1])[0]?.[0];
  if (lowestPlat) insights.push(`${lowestPlat} has your lowest engagement average — consider auditing content format and posting frequency before investing further.`);

  return insights;
}

export function generateRepurposeRecommendations(posts: ContentPost[]): RepurposeRecommendation[] {
  const recs: RepurposeRecommendation[] = [];

  posts.forEach((post) => {
    const score = repurposeScore(post);
    if (score < 20) return;

    const triggers: { trigger: RepurposeRecommendation["trigger"]; action: RepurposeAction; priority: "High" | "Medium" | "Low" }[] = [];

    if (saveRate(post) > 2)       triggers.push({ trigger: "High saves",        action: "Turn into newsletter",          priority: "High"   });
    if (saveRate(post) > 3)       triggers.push({ trigger: "High saves",        action: "Turn into carousel",            priority: "High"   });
    if (shareRate(post) > 1.5)    triggers.push({ trigger: "High shares",       action: "Turn into LinkedIn thought piece", priority: "High" });
    if (post.comments > 40)       triggers.push({ trigger: "High comments",     action: "Turn into podcast segment",     priority: "Medium" });
    if (post.conversionFlag)      triggers.push({ trigger: "Strong conversion activity", action: "Turn into client-facing case study", priority: "High" });
    if (post.topicCategory === "Burnout Prevention" || post.topicCategory === "Black Mental Health")
                                  triggers.push({ trigger: "Strong emotional response", action: "Turn into blog post", priority: "Medium" });
    if (post.topicCategory === "WVW Academy" || post.topicCategory === "Leadership Development")
                                  triggers.push({ trigger: "Strong educational value", action: "Turn into training example", priority: "Medium" });
    if (calcEngagementRate(post) > 10)
                                  triggers.push({ trigger: "High saves",        action: "Turn into short-form video",    priority: "Medium" });

    triggers.slice(0, 3).forEach(({ trigger, action, priority }, i) => {
      recs.push({
        id: `rep-${post.id}-${i}`,
        postId: post.id,
        postTitle: post.title,
        platform: post.platform,
        trigger,
        recommendation: action,
        priority,
        score,
      });
    });
  });

  return recs.sort((a, b) => b.score - a.score).slice(0, 30);
}
