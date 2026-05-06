import { readFileSync } from "fs";
import { NextRequest } from "next/server";

interface ContentRow {
  id: string;
  date: string;
  platform: string;
  account: string;
  content_type: string;
  theme: string;
  status: string;
  file_path: string;
  notes: string;
}

function parseCSV(raw: string): ContentRow[] {
  const lines = raw.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return headers.reduce((obj, key, i) => {
      obj[key as keyof ContentRow] = values[i] ?? "";
      return obj;
    }, {} as ContentRow);
  });
}

export async function GET(_req: NextRequest) {
  const trackerPath =
    process.env["WVW_TRACKER_PATH"] ??
    "/Users/tearz/Documents/Claude/Projects/wvw-full-os/data/content-tracker.csv";

  let rows: ContentRow[] = [];
  try {
    const raw = readFileSync(trackerPath, "utf-8");
    rows = parseCSV(raw);
  } catch {
    return Response.json({ rows: [], byPlatform: {}, byStatus: {}, byTheme: {}, total: 0 });
  }

  // Summaries
  const byPlatform = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.platform] = (acc[r.platform] ?? 0) + 1;
    return acc;
  }, {});

  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const byTheme = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.theme] = (acc[r.theme] ?? 0) + 1;
    return acc;
  }, {});

  // Latest 20 for content map
  const recent = rows.slice(0, 20).map((r) => ({
    id: r.id,
    date: r.date,
    channel: platformLabel(r.platform),
    topic: r.notes,
    theme: r.theme,
    status: capitalize(r.status),
    content_type: r.content_type,
  }));

  return Response.json({ rows: recent, byPlatform, byStatus, byTheme, total: rows.length });
}

function platformLabel(p: string): string {
  const map: Record<string, string> = {
    linkedin_personal: "LinkedIn Personal",
    linkedin_wvw: "LinkedIn WVW",
    instagram: "Instagram",
    tiktok: "TikTok",
    facebook: "Facebook",
    threads: "Threads",
    bluesky: "Bluesky",
  };
  return map[p] ?? p;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
