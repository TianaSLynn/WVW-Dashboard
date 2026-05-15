import { NextRequest } from "next/server";
import { generateDailyPosts } from "@/lib/generate-posts";
import { getTodayTheme } from "@/lib/schedule";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { platforms, theme } = await req.json() as { platforms: string[]; theme?: string };
  if (!platforms?.length) return Response.json({ error: "platforms required" }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set in Vercel environment variables. Go to Vercel → Settings → Environment Variables and add it." },
      { status: 500 }
    );
  }

  const resolvedTheme = theme || getTodayTheme();

  try {
    const posts = await generateDailyPosts(resolvedTheme, platforms as Parameters<typeof generateDailyPosts>[1]);
    return Response.json({ posts, theme: resolvedTheme });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
