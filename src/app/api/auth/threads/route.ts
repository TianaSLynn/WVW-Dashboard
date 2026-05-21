import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const appId = process.env.THREADS_APP_ID;
  if (!appId) {
    return new Response(
      `<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem;background:#F9F5ED;">
        <h2>Missing THREADS_APP_ID</h2>
        <p>Add <strong>THREADS_APP_ID</strong> and <strong>THREADS_APP_SECRET</strong> to Vercel → Settings → Environment Variables.<br/>
        These are your Meta App credentials — find them at <strong>developers.facebook.com → Your App → Settings → Basic</strong>.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/threads/callback`;

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "threads_basic,threads_content_publish",
    response_type: "code",
  });

  return Response.redirect(`https://threads.net/oauth/authorize?${params.toString()}`);
}
