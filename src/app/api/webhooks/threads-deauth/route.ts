import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[threads-deauth] user deauthorized:", JSON.stringify(body));
  } catch {
    // body may not be JSON — that's fine
  }
  return new Response("OK", { status: 200 });
}

export async function GET() {
  return new Response("Threads deauthorize webhook active", { status: 200 });
}
