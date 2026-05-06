const FB_VERSION = "v19.0";

export async function postToFacebook(text: string): Promise<void> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  if (!token || !pageId) throw new Error("Facebook credentials not configured");

  const res = await fetch(`https://graph.facebook.com/${FB_VERSION}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, access_token: token }),
  });
  if (!res.ok) throw new Error(`Facebook ${res.status}: ${await res.text()}`);
}

export async function postToInstagram(caption: string, imageUrl: string): Promise<void> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const igId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!token || !igId) throw new Error("Instagram credentials not configured");

  const containerRes = await fetch(`https://graph.facebook.com/${FB_VERSION}/${igId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
  });
  if (!containerRes.ok) throw new Error(`Instagram container ${containerRes.status}: ${await containerRes.text()}`);

  const { id: creationId } = await containerRes.json() as { id: string };

  const publishRes = await fetch(`https://graph.facebook.com/${FB_VERSION}/${igId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: creationId, access_token: token }),
  });
  if (!publishRes.ok) throw new Error(`Instagram publish ${publishRes.status}: ${await publishRes.text()}`);
}

export async function postToInstagramCarousel(
  slides: string[],
  imageUrls: string[],
  caption: string,
): Promise<void> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const igId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!token || !igId) throw new Error("Instagram credentials not configured");

  // Step 1 — create a media container for each slide
  const childIds: string[] = [];
  for (const imageUrl of imageUrls) {
    const res = await fetch(`https://graph.facebook.com/${FB_VERSION}/${igId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, is_carousel_item: true, access_token: token }),
    });
    if (!res.ok) throw new Error(`Instagram carousel item ${res.status}: ${await res.text()}`);
    const { id } = await res.json() as { id: string };
    childIds.push(id);
  }

  // Step 2 — create carousel container (children must be an array)
  const carouselRes = await fetch(`https://graph.facebook.com/${FB_VERSION}/${igId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "CAROUSEL",
      children: childIds,
      caption,
      access_token: token,
    }),
  });
  if (!carouselRes.ok) throw new Error(`Instagram carousel ${carouselRes.status}: ${await carouselRes.text()}`);
  const { id: carouselId } = await carouselRes.json() as { id: string };

  // Step 3 — publish
  const publishRes = await fetch(`https://graph.facebook.com/${FB_VERSION}/${igId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: carouselId, access_token: token }),
  });
  if (!publishRes.ok) throw new Error(`Instagram carousel publish ${publishRes.status}: ${await publishRes.text()}`);
}

export async function postToThreads(text: string): Promise<void> {
  const token = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;
  if (!token || !userId) throw new Error("Threads credentials not configured");

  // Step 1 — create container
  const containerRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ media_type: "TEXT", text, access_token: token }),
  });
  if (!containerRes.ok) throw new Error(`Threads container ${containerRes.status}: ${await containerRes.text()}`);

  const { id: creationId } = await containerRes.json() as { id: string };

  // Step 2 — publish
  const publishRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: creationId, access_token: token }),
  });
  if (!publishRes.ok) throw new Error(`Threads publish ${publishRes.status}: ${await publishRes.text()}`);
}
