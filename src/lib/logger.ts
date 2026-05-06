import { existsSync, readFileSync, writeFileSync } from "fs";

const LOG_PATH = process.env.VERCEL
  ? "/tmp/wvw-post-log.json"
  : (process.env.WVW_LOG_PATH ??
      "/Users/tearz/Documents/Claude/Projects/wvw-full-os/logs/post-log.json");

export interface PostLogEntry {
  id: string;
  timestamp: string;
  platform: string;
  theme: string;
  excerpt: string;
  status: "posted" | "queued" | "error" | "skipped";
}

export function appendPostLog(entry: {
  platform: string;
  theme: string;
  text: string;
  status: PostLogEntry["status"];
}): void {
  let log: PostLogEntry[] = readPostLog();
  log.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    platform: entry.platform,
    theme: entry.theme,
    excerpt: entry.text.slice(0, 120),
    status: entry.status,
  });
  try {
    writeFileSync(LOG_PATH, JSON.stringify(log.slice(0, 100), null, 2), "utf-8");
  } catch {
    // read-only filesystem in some Vercel environments — skip silently
  }
}

export function readPostLog(): PostLogEntry[] {
  if (!existsSync(LOG_PATH)) return [];
  try {
    return JSON.parse(readFileSync(LOG_PATH, "utf-8")) as PostLogEntry[];
  } catch {
    return [];
  }
}
