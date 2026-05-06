export async function queueInBuffer(profileIds: string[], text: string, imageUrl?: string): Promise<void> {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  if (!token) throw new Error("BUFFER_ACCESS_TOKEN not configured");
  if (profileIds.length === 0) return;

  const params = new URLSearchParams();
  profileIds.forEach((id) => params.append("profile_ids[]", id));
  params.set("text", text);
  if (imageUrl) {
    params.set("media[picture]", imageUrl);
    params.set("media[thumbnail]", imageUrl);
  }

  const res = await fetch("https://api.buffer.com/1/updates/create.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Buffer ${res.status}: ${err}`);
  }
}
